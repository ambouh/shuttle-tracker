import { ChevronUp, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RouteDetailPreviewViewModel } from "@/lib/route-detail-preview";

interface CommentPreviewProps {
  comments: RouteDetailPreviewViewModel["comments"];
  emptyCopy: string;
}

export function CommentPreview({ comments, emptyCopy }: CommentPreviewProps) {
  return (
    <section className="px-ui-5 py-ui-6" aria-labelledby="comments-heading">
      <div className="flex items-center gap-ui-3 px-ui-2">
        <h2 id="comments-heading" className="text-ui-lg font-bold">
          Comments ({comments.length})
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7 rounded-full border-2 border-accent p-0 text-accent disabled:opacity-100"
          aria-label="Adding comments is available in a later feature"
          disabled
        >
          <Plus className="size-4 stroke-2" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon-lg"
          className="ml-auto size-9 rounded-full bg-surface-soft p-0 disabled:opacity-100"
          aria-label="Comment collapse controls are available in a later feature"
          disabled
        >
          <ChevronUp className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <Card className="mt-ui-3 gap-ui-4 rounded-md border-0 bg-surface px-ui-5 py-ui-4 shadow-none ring-0">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <article key={comment.id} className="flex min-w-0 gap-ui-4">
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full text-ui-xs font-bold text-canvas ${
                  comment.isDriver ? "bg-avatar-lilac" : "bg-avatar-blue"
                }`}
                aria-hidden="true"
              >
                {comment.initials}
              </span>
              <div className="min-w-0">
                <h3 className="break-words font-bold leading-normal-ui">
                  {comment.displayName}
                  {comment.isDriver ? " (Driver)" : ""}
                </h3>
                <p className="break-words text-ui-sm leading-normal-ui text-foreground">
                  {comment.message}
                </p>
              </div>
            </article>
          ))
        ) : (
          <p className="text-ui-sm text-text-muted">{emptyCopy}</p>
        )}
      </Card>
    </section>
  );
}
