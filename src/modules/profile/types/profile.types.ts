export type Profile = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  image?: string;
};

export type UpdateProfileRequest = {
  name: string;
  email: string;
  phone?: string;
};

export type ChangePasswordRequest = {
  old_password?: string;
  new_password: string;
  new_password_confirmation: string;
};

export type ProfileResponse = {
  data: Profile;
};

export type UpdateProfileResponse = {
  message: string;
  data: Profile;
};

export type BasicResponse = {
  message: string;
};
