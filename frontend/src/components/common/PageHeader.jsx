import Badge from "@/components/ui/Badge";

function PageHeader({ eyebrow, title, description, badge, actions }) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="space-y-3">
        {eyebrow ? (
          <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </div>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {badge ? <Badge variant="info">{badge}</Badge> : null}
        {actions}
      </div>
    </div>
  );
}

export default PageHeader;
