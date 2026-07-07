import Badge from "@/components/ui/Badge";

function PageHeader({ eyebrow, title, description, badge }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p> : null}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p> : null}
        </div>
      </div>
      {badge ? <Badge variant="info">{badge}</Badge> : null}
    </div>
  );
}

export default PageHeader;
