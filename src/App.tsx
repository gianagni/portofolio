import { FadeSection } from './components/FadeSection'
import { Nav } from './components/Nav'
import { ProjectRow, type ProjectItem } from './components/ProjectRow'
import { TerminalCard } from './components/TerminalCard'
import { TextLink } from './components/TextLink'

const PROJECTS: readonly ProjectItem[] = [
  {
    title: 'SPN Meeting Room Booking System',
    status: 'INTERNAL',
    description: 'Internal meeting room booking and approval system.',
    stack: ['Next.js', 'Better Auth', 'Drizzle', 'PostgreSQL', 'Docker'],
  },
  {
    title: 'Flowprint',
    status: 'PRIVATE ALPHA',
    description:
      'Local-first CLI to orient a developer inside an unfamiliar TypeScript/JavaScript codebase.',
    stack: ['TypeScript', 'Node.js'],
  },
  {
    title: 'Lahena Lab',
    status: '2ND PLACE KMIPN VIII 2026',
    description: 'Career readiness and skill gap mapping for students.',
    stack: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'],
  },
  {
    title: 'NG Market',
    status: 'LIVE',
    description: 'Digital product marketplace with admin verification before stock allocation.',
    stack: ['Next.js', 'Supabase', 'PostgreSQL', 'Vercel'],
  },
]

const META = [
  { label: 'Role', value: 'Full-stack developer' },
  { label: 'Focus', value: 'Web apps, database to UI' },
  { label: 'Location', value: 'Jakarta, Indonesia' },
  { label: 'Status', value: 'Contract IT Staff, SPN Sep-Dec 2026' },
] as const

const STACK = [
  'Next.js',
  'TypeScript',
  'Supabase',
  'PostgreSQL',
  'Node.js',
  'SvelteKit',
  'CodeIgniter 4',
  'PHP',
  'MySQL',
  'Tailwind CSS',
  'Docker',
  'Git',
] as const

function SectionHeading({ number, title, id }: { number: string; title: string; id: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-[12px] font-medium text-[#22C55E]">{number}</span>
      <h2 id={id} className="text-[16px] font-medium tracking-[-0.015em] text-[#111111]">
        {title}
      </h2>
      <span aria-hidden="true" className="h-px flex-1 bg-[#E6E6E0]" />
    </div>
  )
}

export default function App() {
  return (
    <div id="top" className="min-h-screen bg-[#FAFAF7] text-[#111111]">
      <div className="mx-auto w-full max-w-[768px] px-6 pb-20 sm:pb-24">
        <Nav />

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-y border-[#E6E6E0] py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717A]">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
            Available after 22 Dec 2026
          </span>
          <span>Jakarta, ID</span>
          <span>WIB UTC+7</span>
        </div>

        <main className="mt-12 flex flex-col gap-[72px] sm:mt-16">
          <div className="dot-grid -mx-6 px-6 pt-2 pb-10 sm:-mx-8 sm:px-8">
            <FadeSection ariaLabelledBy="hero-heading">
              <h1
                id="hero-heading"
                className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#111111] sm:text-[56px]"
              >
                Nandito Gianza Agni
              </h1>
              <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.08em] text-[#71717A]">
                Full-stack developer, Jakarta.
              </p>
              <p className="mt-6 max-w-[620px] text-[16px] leading-[1.65] text-[#111111] sm:text-[17px]">
                I build web apps from database to UI. I start from the user flow and the rules the
                system has to protect, then build the interface, backend, and database around them.
              </p>
              <p className="mt-4 text-[14px] leading-[1.6] text-[#71717A]">
                Currently: Contract IT Staff at PT Solusi Pelayaran Nusantara (SPN), Sep-Dec 2026.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-5 text-[14px]">
                <TextLink>GitHub</TextLink>
                <TextLink>LinkedIn</TextLink>
                <TextLink>Email</TextLink>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-px border border-[#E6E6E0] bg-[#E6E6E0] sm:grid-cols-2">
                {META.map((item) => (
                  <div key={item.label} className="bg-[#FAFAF7] p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717A]">
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-[14px] leading-[1.5] text-[#111111]">{item.value}</p>
                  </div>
                ))}
              </div>
            </FadeSection>

            <div className="mt-10">
              <TerminalCard />
            </div>
          </div>

          <FadeSection id="work" ariaLabelledBy="work-heading">
            <SectionHeading number="01" title="Work" id="work-heading" />
            <div className="mt-6 divide-y divide-[#E6E6E0] border-y border-[#E6E6E0]">
              {PROJECTS.map((project, index) => (
                <ProjectRow
                  key={project.title}
                  project={project}
                  index={String(index + 1).padStart(2, '0')}
                />
              ))}
            </div>
            <p className="mt-6 text-[14px] leading-[1.6] text-[#71717A]">
              Also built: DiscloseKit, Seikarsa (in development), Lummix (in development), SME Cash
              Management.
            </p>
          </FadeSection>

          <FadeSection id="experience" ariaLabelledBy="experience-heading">
            <SectionHeading number="02" title="Experience" id="experience-heading" />
            <p className="mt-5 text-[15px] leading-[1.65] text-[#111111]">
              PT Solusi Pelayaran Nusantara (SPN) - Contract IT Staff / Internship, 22 Sep - 22 Dec
              2026. Main project: Meeting Room Booking System.
            </p>
          </FadeSection>

          <FadeSection id="stack" ariaLabelledBy="stack-heading">
            <SectionHeading number="03" title="Stack" id="stack-heading" />
            <div className="mt-5 flex flex-wrap gap-2">
              {STACK.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#E6E6E0] bg-[#FAFAF7] px-3 py-1.5 font-mono text-[12px] text-[#111111]"
                >
                  {item}
                </span>
              ))}
            </div>
          </FadeSection>

          <FadeSection id="contact" ariaLabelledBy="contact-heading">
            <SectionHeading number="04" title="Contact" id="contact-heading" />
            <div className="mt-5 w-full rounded-[12px] bg-[#101010] p-5 font-mono text-[14px] leading-[1.7] text-[#A1A1AA] shadow-[0_10px_30px_rgba(17,17,17,0.08)]">
              <p>
                <span className="text-[#22C55E]">$ </span>
                <span className="text-[#F4F4F5]">./contact.sh</span>
              </p>
              <p className="mt-3 text-[#A1A1AA]">
                Email me for work, freelance, or a demo walkthrough.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-5">
                <TextLink tone="accent">Email</TextLink>
                <TextLink tone="accent">GitHub</TextLink>
                <TextLink tone="accent">LinkedIn</TextLink>
              </div>
            </div>
            <footer className="mt-16 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6E6E0] pt-6 font-mono text-[12px] uppercase tracking-[0.06em] text-[#71717A]">
              <span>Nandito Gianza Agni - Jakarta</span>
              <span>Next.js / TypeScript</span>
            </footer>
          </FadeSection>
        </main>
      </div>
    </div>
  )
}
