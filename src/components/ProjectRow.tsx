import { TextLink } from './TextLink'

export interface ProjectItem {
  title: string
  status?: string
  description: string
  stack: string[]
  href?: string
}

interface ProjectRowProps {
  project: ProjectItem
  index: string
}

export function ProjectRow({ project, index }: ProjectRowProps) {
  const { title, status, description, stack, href } = project

  return (
    <div className="group -mx-2 rounded-lg px-2 py-6 transition-colors first:pt-6 last:pb-6 hover:bg-[#F1F1EC]">
      <div className="flex items-baseline gap-3">
        <span className="shrink-0 font-mono text-[12px] text-[#71717A]">{index}</span>
        <h3 className="text-[18px] font-medium tracking-[-0.01em] text-[#111111] sm:text-[20px]">
          {title}
        </h3>
        <span aria-hidden="true" className="ml-auto shrink-0 font-mono text-[14px] text-[#22C55E] opacity-0 transition-opacity group-hover:opacity-100">
          -&gt;
        </span>
        {status ? (
          <span className="shrink-0 rounded-full border border-[#E6E6E0] bg-[#FAFAF7] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-[#111111]">
            {status}
          </span>
        ) : null}
      </div>

      <p className="mt-2 pl-8 text-[15px] leading-[1.6] text-[#71717A]">{description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 pl-8">
        {stack.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[#E6E6E0] bg-[#FAFAF7] px-2.5 py-1 font-mono text-[11px] text-[#71717A]"
          >
            {item}
          </span>
        ))}
        {href ? (
          <TextLink
            href={href}
            target="_blank"
            rel="noreferrer"
            className="ml-auto shrink-0 text-[13px]"
          >
            View
          </TextLink>
        ) : null}
      </div>
    </div>
  )
}
