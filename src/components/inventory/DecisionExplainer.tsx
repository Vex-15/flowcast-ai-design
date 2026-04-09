import { MessageSquare } from "lucide-react";

const DecisionExplainer = ({
  explanation,
  reorderQty,
}: {
  explanation: string[];
  reorderQty: number;
}) => {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Decision Explanation</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Why this recommendation was made</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
        <p className="text-sm text-foreground font-semibold mb-3">
          "Reorder {reorderQty} units because:"
        </p>
        <div className="space-y-2">
          {explanation.map((line, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-primary text-sm mt-0.5">•</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{line}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DecisionExplainer;
