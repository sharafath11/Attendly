import fs from 'fs';

let content = fs.readFileSync('client/app/(platform)/messages/page.tsx', 'utf8');

content = content.replace(
  'import { whatsappApi } from "@/services/whatsapp.api";',
  'import { whatsappApi } from "@/services/whatsapp.api";\nimport { parentApi } from "@/services/parent.api";\nimport { useBatches } from "@/hooks/useBatches";'
);

content = content.replace(
  'const [draft, setDraft] = useState("");',
  `const [targetAudience, setTargetAudience] = useState("parents");
  const [batchId, setBatchId] = useState("");
  const [draft, setDraft] = useState("Hi {{parent_name}}, ");
  const { data: batchesData } = useBatches({});
  
  const sendBroadcastMutation = useMutation({
    mutationFn: () => parentApi.universalBroadcast(targetAudience, draft, targetAudience === "batch" ? batchId : undefined),
    onSuccess: (res: any) => {
      if (res?.ok) {
        toast.success(res?.msg || "Broadcast sent successfully");
        setDraft("");
      } else {
        toast.error(res?.msg || "Failed to send broadcast");
      }
    },
    onError: (err: any) => toast.error(err?.message || "Failed to send broadcast"),
  });
  `
);

content = content.replace(
  'const sendPreview = () => {',
  `const sendPreview = () => {
    if (!draft.trim()) {
      toast.message("Type a message first");
      return;
    }
    if (targetAudience === "batch" && !batchId) {
      toast.message("Please select a batch first");
      return;
    }
    sendBroadcastMutation.mutate();
  };
  const _discard_sendPreview = () => {`
);

const chatHubReplaceStart = `      {activeTab === "chat" ? (`;
const chatHubReplaceEnd = `      ) : (`;

const newChatHub = `      {activeTab === "chat" ? (
        <div className="mx-auto flex flex-col gap-6 lg:flex-row lg:items-start">
          <section className="flex flex-1 flex-col rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Bulk Broadcast</h2>
              <p className="text-sm text-muted-foreground mt-1">Send customized WhatsApp messages to specific audiences.</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Target Audience</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { id: "parents", label: "All Parents", icon: Users },
                    { id: "teachers", label: "All Teachers", icon: Users },
                    { id: "batch", label: "Specific Batch", icon: Users },
                    { id: "all", label: "Entire Center", icon: Megaphone },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTargetAudience(option.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition",
                        targetAudience === option.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <option.icon className="h-5 w-5" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {targetAudience === "batch" && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Select Batch</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus-visible:outline-primary"
                  >
                    <option value="">-- Choose a Batch --</option>
                    {batchesData?.batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchName} ({b.studentCount} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Message</label>
                <div className="flex flex-wrap gap-2 pb-2">
                  <QuickChip icon={Megaphone} label="{{parent_name}}" onClick={() => setDraft(d => d + "{{parent_name}}")} />
                  <QuickChip icon={Users} label="{{student_name}}" onClick={() => setDraft(d => d + "{{student_name}}")} />
                  <QuickChip icon={Users} label="{{teacher_name}}" onClick={() => setDraft(d => d + "{{teacher_name}}")} />
                </div>
                <div className="relative">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[160px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus-visible:outline-primary"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                    Supports variables
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div className="text-sm">
                  {getStatusBadge(waStatus)}
                </div>
                <Button
                  type="button"
                  onClick={sendPreview}
                  disabled={waStatus !== "open" || sendBroadcastMutation.isPending}
                  isLoading={sendBroadcastMutation.isPending}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Broadcast
                </Button>
              </div>
            </div>
          </section>
        </div>`;

content = content.substring(0, content.indexOf(chatHubReplaceStart)) + newChatHub + content.substring(content.indexOf(chatHubReplaceEnd));

fs.writeFileSync('client/app/(platform)/messages/page.tsx', content);
