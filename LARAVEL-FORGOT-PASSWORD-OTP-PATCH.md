# Laravel Backend Patch: Forgot Password + OTP

هذا الكود مبني على Laravel 10/11، ويستخدم جدولًا مستقلًا لتخزين OTP بشكل آمن، مع مدة صلاحية، حد أقصى للمحاولات، rate limiting، وreset token مؤقت لا يتم تخزينه بصيغته الأصلية.

> **مهم:** الواجهة الحالية تتحقق من OTP ثم ترسل OTP فقط عند تغيير كلمة المرور، ولا ترسل البريد أو reset token. هذا غير آمن وغير كافٍ لتحديد سجل OTP بشكل موثوق. لذلك يتضمن هذا الملف تعديلًا صغيرًا مطلوبًا في الواجهة بعد كود الـ Backend.

## 1. Migration

أنشئ الملف:

`database/migrations/xxxx_xx_xx_xxxxxx_create_password_reset_otps_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('password_reset_otps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email')->index();
            $table->string('purpose')->default('password_reset')->index();
            $table->string('otp_hash');
            $table->string('reset_token_hash')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('consumed_at')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamps();

            $table->index(['email', 'purpose', 'consumed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_otps');
    }
};
```

ثم شغّل:

```bash
php artisan migrate
```

## 2. Model

أنشئ:

`app/Models/PasswordResetOtp.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PasswordResetOtp extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'purpose',
        'otp_hash',
        'reset_token_hash',
        'expires_at',
        'verified_at',
        'consumed_at',
        'attempts',
        'last_sent_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'consumed_at' => 'datetime',
        'last_sent_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return now()->greaterThanOrEqualTo($this->expires_at);
    }

    public function isConsumed(): bool
    {
        return $this->consumed_at !== null;
    }
}
```

## 3. Notification لإرسال OTP

أنشئ:

`app/Notifications/PasswordResetOtpNotification.php`

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetOtpNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $otp,
        private readonly int $expiresInMinutes = 10,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Password reset verification code')
            ->greeting('Hello,')
            ->line('Use the following verification code to reset your password:')
            ->line('')
            ->line("OTP: {$this->otp}")
            ->line("This code expires in {$this->expiresInMinutes} minutes.")
            ->line('If you did not request a password reset, you can ignore this email.');
    }
}
```

إذا لم يكن لديك queue worker، احذف `implements ShouldQueue` و`use Queueable` مؤقتًا، أو شغّل:

```bash
php artisan queue:work
```

## 4. Form Requests

### `app/Http/Requests/Auth/ForgotPasswordRequest.php`

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc,dns', 'max:255'],
        ];
    }
}
```

### `app/Http/Requests/Auth/VerifyForgotPasswordOtpRequest.php`

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyForgotPasswordOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc,dns', 'max:255'],
            'otp' => ['required', 'digits:6'],
        ];
    }
}
```

### `app/Http/Requests/Auth/ResetPasswordRequest.php`

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc,dns', 'max:255'],
            'reset_token' => ['required', 'string', 'size:64'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ];
    }
}
```

## 5. Controller

أنشئ أو عدّل:

`app/Http/Controllers/Api/Auth/PasswordResetController.php`

```php
<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyForgotPasswordOtpRequest;
use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Notifications\PasswordResetOtpNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class PasswordResetController extends Controller
{
    private const PURPOSE = 'password_reset';
    private const OTP_TTL_MINUTES = 10;
    private const RESET_TOKEN_TTL_MINUTES = 10;
    private const MAX_OTP_ATTEMPTS = 5;

    public function sendOtp(ForgotPasswordRequest $request): JsonResponse
    {
        $email = Str::lower(trim($request->string('email')->toString()));
        $rateKey = 'password-reset-send:' . sha1($email . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($rateKey, 3)) {
            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please try again later.',
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        RateLimiter::hit($rateKey, 60);

        $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        // لا تكشف إذا كان البريد موجودًا أو لا.
        if (!$user) {
            return response()->json([
                'success' => true,
                'message' => 'If the email exists, a verification code has been sent.',
            ], Response::HTTP_ACCEPTED);
        }

        PasswordResetOtp::query()
            ->where('email', $email)
            ->where('purpose', self::PURPOSE)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        $otp = (string) random_int(100000, 999999);

        $record = PasswordResetOtp::create([
            'user_id' => $user->id,
            'email' => $email,
            'purpose' => self::PURPOSE,
            'otp_hash' => Hash::make($otp),
            'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
            'last_sent_at' => now(),
        ]);

        try {
            $user->notify(new PasswordResetOtpNotification($otp, self::OTP_TTL_MINUTES));
        } catch (\Throwable $exception) {
            report($exception);
            $record->delete();

            return response()->json([
                'success' => false,
                'message' => 'Unable to send the verification code. Please try again later.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return response()->json([
            'success' => true,
            'message' => 'A verification code has been sent to your email.',
            'data' => [
                'expires_in' => self::OTP_TTL_MINUTES * 60,
            ],
        ], Response::HTTP_ACCEPTED);
    }

    public function verifyOtp(VerifyForgotPasswordOtpRequest $request): JsonResponse
    {
        $email = Str::lower(trim($request->string('email')->toString()));
        $otp = $request->string('otp')->toString();
        $rateKey = 'password-reset-verify:' . sha1($email . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($rateKey, 10)) {
            return response()->json([
                'success' => false,
                'message' => 'Too many verification attempts. Please request a new code.',
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        RateLimiter::hit($rateKey, 60);

        $record = PasswordResetOtp::query()
            ->where('email', $email)
            ->where('purpose', self::PURPOSE)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        if (!$record || $record->isExpired() || $record->attempts >= self::MAX_OTP_ATTEMPTS) {
            return response()->json([
                'success' => false,
                'message' => 'The verification code is invalid or expired.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!Hash::check($otp, $record->otp_hash)) {
            $record->increment('attempts');

            return response()->json([
                'success' => false,
                'message' => 'The verification code is invalid or expired.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $resetToken = Str::random(64);

        $record->forceFill([
            'reset_token_hash' => Hash::make($resetToken),
            'verified_at' => now(),
        ])->save();

        RateLimiter::clear($rateKey);

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully.',
            'data' => [
                'valid' => true,
                'reset_token' => $resetToken,
                'expires_in' => self::RESET_TOKEN_TTL_MINUTES * 60,
            ],
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $email = Str::lower(trim($request->string('email')->toString()));
        $resetToken = $request->string('reset_token')->toString();

        $record = PasswordResetOtp::query()
            ->where('email', $email)
            ->where('purpose', self::PURPOSE)
            ->whereNotNull('verified_at')
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        if (!$record || $record->isExpired() || !$record->reset_token_hash || !Hash::check($resetToken, $record->reset_token_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'The reset session is invalid or expired. Please request a new code.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'The reset session is invalid or expired.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::transaction(function () use ($user, $request, $record): void {
            $user->forceFill([
                'password' => Hash::make($request->string('password')->toString()),
                'remember_token' => null,
            ])->save();

            $record->forceFill([
                'consumed_at' => now(),
                'reset_token_hash' => null,
                'otp_hash' => '',
            ])->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.',
        ]);
    }
}
```

## 6. Routes

في `routes/api.php`:

```php
<?php

use App\Http\Controllers\Api\Auth\PasswordResetController;
use Illuminate\Support\Facades\Route;

Route::post('/forgot-password', [PasswordResetController::class, 'sendOtp'])
    ->middleware('throttle:otp-send')
    ->name('password.forgot');

Route::post('/verify-otp-forgot-password', [PasswordResetController::class, 'verifyOtp'])
    ->middleware('throttle:otp-verify')
    ->name('password.verify-otp');

Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])
    ->middleware('throttle:password-reset')
    ->name('password.reset');
```

إذا كان ملف `routes/api.php` يعمل تلقائيًا تحت prefix `/api`، فالعناوين النهائية ستكون:

```text
POST /api/forgot-password
POST /api/verify-otp-forgot-password
POST /api/reset-password
```

وبما أن مشروعك يستخدم `/api/v1`، تأكد أن `bootstrap/app.php` أو route service provider يضيف prefix `api/v1`. لا تضف `/api/v1` مرتين داخل route نفسه.

## 7. Rate Limiter

في `app/Providers/AppServiceProvider.php` داخل `boot()`:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

public function boot(): void
{
    RateLimiter::for('otp-send', function (Request $request) {
        $email = Str::lower((string) $request->input('email'));

        return [
            Limit::perMinute(3)->by('otp-send-email:' . sha1($email)),
            Limit::perMinute(10)->by('otp-send-ip:' . $request->ip()),
        ];
    });

    RateLimiter::for('otp-verify', function (Request $request) {
        $email = Str::lower((string) $request->input('email'));

        return [
            Limit::perMinute(10)->by('otp-verify-email:' . sha1($email)),
            Limit::perMinute(30)->by('otp-verify-ip:' . $request->ip()),
        ];
    });

    RateLimiter::for('password-reset', function (Request $request) {
        return Limit::perMinute(5)->by($request->ip());
    });
}
```

## 8. Mail configuration

في `.env` يجب أن تكون بيانات SMTP صحيحة:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-user@example.com
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@example.com
MAIL_FROM_NAME="WorkFlow"
QUEUE_CONNECTION=database
```

إذا استخدمت `QUEUE_CONNECTION=database`، أنشئ جدول jobs وشغّل worker:

```bash
php artisan queue:table
php artisan migrate
php artisan queue:work
```

للاختبار السريع فقط، استخدم `QUEUE_CONNECTION=sync`.

## 9. التعديل المطلوب في الواجهة

الـ Backend أعلاه يرجع `reset_token` بعد التحقق. يجب تعديل hook الخاص بالتحقق حتى يعيد response، ثم تمرير البريد وreset token إلى خطوة تغيير كلمة المرور.

### تعديل `ForgotPasswordPage.tsx`

اجعل `OtpStep` يستقبل callback يعيد token:

```tsx
function OtpStep({
  email,
  onSuccess,
}: {
  email: string;
  onSuccess: (payload: { otp: string; resetToken: string }) => void;
}) {
```

ثم غيّر `onSuccess` داخل mutation:

```tsx
onSuccess: (response: any) => {
  const resetToken = response?.data?.reset_token;

  if (!resetToken) {
    setOtpError(t("generic_error"));
    return;
  }

  onSuccess({ otp, resetToken });
},
```

واجعل `ResetStep` يستقبل البريد والـ token:

```tsx
function ResetStep({
  email,
  resetToken,
  onSuccess,
}: {
  email: string;
  resetToken: string;
  onSuccess: () => void;
}) {
```

وفي الاستدعاء:

```tsx
resetPassword(
  {
    email,
    reset_token: resetToken,
    password: data.password,
    password_confirmation: data.password_confirmation,
  },
  {
    onSuccess,
    onError: () => toast.error(t("generic_error")),
  }
);
```

وفي component الرئيسي:

```tsx
const [resetToken, setResetToken] = useState("");

<OtpStep
  email={email}
  onSuccess={({ resetToken: token }) => {
    setResetToken(token);
    setStep(3);
  }}
/>

<ResetStep
  email={email}
  resetToken={resetToken}
  onSuccess={() => setStep(4)}
/>
```

### تعديل type `ResetPasswordRequest`

في `src/modules/auth/types/auth.types.ts`:

```ts
export type ResetPasswordRequest = {
  email: string;
  reset_token: string;
  password: string;
  password_confirmation: string;
};
```

### تأكد من `auth.api.ts`

```ts
resetPassword: async (data: ResetPasswordRequest) => {
  const response = await apiClient.post<MessageResponse>(
    "/reset-password",
    data
  );

  return (response as any).data || response;
},
```

## 10. اختبار يدوي باستخدام cURL

### إرسال OTP

```bash
curl -i -X POST https://workflow.aliservice.site/api/v1/forgot-password \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

المتوقع: `202`.

### التحقق من OTP

```bash
curl -i -X POST https://workflow.aliservice.site/api/v1/verify-otp-forgot-password \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","otp":"123456"}'
```

المتوقع عند النجاح:

```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "data": {
    "valid": true,
    "reset_token": "...64 characters...",
    "expires_in": 600
  }
}
```

### تغيير كلمة المرور

```bash
curl -i -X POST https://workflow.aliservice.site/api/v1/reset-password \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "reset_token":"TOKEN_FROM_VERIFY_RESPONSE",
    "password":"NewPassword!123",
    "password_confirmation":"NewPassword!123"
  }'
```

## 11. أوامر التنظيف والتحقق

```bash
php artisan optimize:clear
php artisan migrate
php artisan route:list --path=forgot-password
php artisan route:list --path=verify-otp-forgot-password
php artisan route:list --path=reset-password
php artisan queue:work
```

## 12. ملاحظات مهمة قبل الدمج

لا تستخدم `Hash::make()` لمقارنة OTP أو reset token؛ المقارنة يجب أن تكون عبر `Hash::check()`. لا تسجل OTP أو reset token في logs. لا ترجع رسالة مثل “البريد غير موجود” حتى لا تكشف حسابات المستخدمين. كذلك يجب التأكد من أن الخادم يعيد JSON مع status `401/403/404/422/429/500` بدل redirect إلى HTML Login عند استدعاء مسارات API.

إذا كان جدول المستخدمين لديك ليس `users` أو عمود كلمة المرور ليس `password`، يجب تعديل migration والعلاقات والسطر الخاص بتحديث المستخدم في controller. وإذا كان مشروعك يستخدم guard مختلفًا، يجب تعديل `User` model وpassword broker بما يتوافق مع الـ guard الفعلي.
