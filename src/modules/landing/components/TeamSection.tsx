import { useTranslations } from "next-intl"
import { Text } from "@/components/atoms/Text"
import { FadeIn } from "@/animation/FadeIn"
import { SlideIn } from "@/animation/SlideIn"
import { Mail } from "@/assets/icons/icons"
import Image from "next/image"
import {raghad,ahmed,alaa2,zainab} from "@/assets/images/images"
export function TeamSection() {
  const t = useTranslations("Index")

  const team = [
    {
      name: t("teamZainab"),
      role: t("roleZainab"),
      image: zainab,
      linkedin: "https://www.linkedin.com/in/zeinab-al-mudalal-680199308",
      email: "mailto:zeinabalmudalal@workflownets.com",
      whatsapp: "https://wa.me/972592132403"
    },
    {
      name: t("teamAlaa"),
      role: t("roleAlaa"),
      image: alaa2,
      linkedin: "https://www.linkedin.com/in/alaa2003",
      email: "mailto:alaamhammad2003@gmail.com",
      whatsapp: "https://wa.me/972597696155"
    },
    {
      name: t("teamRaghad"),
      role: t("roleRaghad"),
      image: raghad,
      linkedin: "https://www.linkedin.com/in/raghadayyad",
      email: "mailto:raghadabdulla609@gmail.com",
      whatsapp: "https://wa.me/970592106046"
    },
    {
      name: t("teamAhmed"),
      role: t("roleAhmed"),
      image: ahmed,
      linkedin: "https://www.linkedin.com/in/ahmed-shanan-695154228",
      email: "mailto:ahmedjshanan@gmail.com",
      whatsapp: "https://wa.me/qr/ZDH7N3AGI2FVJ1"
    },
  ]

  return (
    <section className="py-16 md:py-24 relative z-10" id="team">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-wider uppercase text-sm mb-4 block">
              {t("teamTag")}
            </span>
            <Text tag="h2" size="xl" className="mb-4 text-center text-3xl font-bold">
              {t("teamTitle")}
            </Text>
            <Text color="gray" className="max-w-2xl mx-auto text-center">
              {t("teamDesc")}
            </Text>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, idx) => (
            <SlideIn key={idx} delay={0.1 * idx} direction="up">
              <div className="bg-background/50 backdrop-blur-sm border border-border rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-background shadow-lg group-hover:border-primary transition-colors duration-300">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <Text tag="h3" size="lg" className="mb-1 font-bold">
                  {member.name}
                </Text>
                <Text size="sm" color="primary" className="font-medium mb-4 text-center">
                  {member.role}
                </Text>
                
                <div className="flex items-center justify-center gap-4 ds-text-gray">
                  {member.email && (
                    <a href={member.email} className="hover:text-primary transition-colors" aria-label="Email">
                      <Mail className="w-5 h-5" />
                    </a>
                  )}
                  {member.whatsapp && (
                    <a href={member.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors" aria-label="WhatsApp">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.394 0 0 5.394 0 12.031c0 2.12.549 4.184 1.593 6.002L.15 24l6.113-1.603c1.748.952 3.708 1.455 5.768 1.455 6.637 0 12.031-5.394 12.031-12.031S18.668 0 12.031 0zm6.13 17.382c-.274.774-1.583 1.492-2.186 1.536-.576.042-1.314.15-4.004-.962-3.232-1.336-5.328-4.664-5.485-4.873-.158-.208-1.311-1.743-1.311-3.328 0-1.586.824-2.373 1.116-2.673.292-.3.635-.375.845-.375.21 0 .42.001.608.009.198.009.465-.078.728.555.274.66.887 2.164.966 2.33.079.167.132.36.027.57-.105.208-.158.337-.316.525-.158.188-.337.397-.474.545-.158.167-.327.35-.145.66.182.31 .81 1.336 1.742 2.164 1.206 1.071 2.215 1.401 2.53 1.568.316.167.5.145.685-.062.185-.208.79-1.02 1.002-1.371.21-.35.42-.29.762-.167.342.125 2.165 1.02 2.534 1.208.369.188.614.282.705.438.092.156.092.906-.182 1.68z"/></svg>
                    </a>
                  )}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(member as any).telegram && (
                    <a href={(member as any).telegram} target="_blank" rel="noopener noreferrer" className="hover:text-[#0088cc] transition-colors" aria-label="Telegram">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#0077b5] transition-colors" aria-label="LinkedIn">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  )}
                  {!member.email && !member.whatsapp && !member.linkedin && (
                    <>
                      <a href="#" className="hover:text-[#25D366] transition-colors" aria-label="WhatsApp">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.394 0 0 5.394 0 12.031c0 2.12.549 4.184 1.593 6.002L.15 24l6.113-1.603c1.748.952 3.708 1.455 5.768 1.455 6.637 0 12.031-5.394 12.031-12.031S18.668 0 12.031 0zm6.13 17.382c-.274.774-1.583 1.492-2.186 1.536-.576.042-1.314.15-4.004-.962-3.232-1.336-5.328-4.664-5.485-4.873-.158-.208-1.311-1.743-1.311-3.328 0-1.586.824-2.373 1.116-2.673.292-.3.635-.375.845-.375.21 0 .42.001.608.009.198.009.465-.078.728.555.274.66.887 2.164.966 2.33.079.167.132.36.027.57-.105.208-.158.337-.316.525-.158.188-.337.397-.474.545-.158.167-.327.35-.145.66.182.31 .81 1.336 1.742 2.164 1.206 1.071 2.215 1.401 2.53 1.568.316.167.5.145.685-.062.185-.208.79-1.02 1.002-1.371.21-.35.42-.29.762-.167.342.125 2.165 1.02 2.534 1.208.369.188.614.282.705.438.092.156.092.906-.182 1.68z"/></svg>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </SlideIn>
          ))}
        </div>
      </div>
    </section>
  )
}
