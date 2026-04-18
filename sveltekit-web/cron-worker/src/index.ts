interface Env {
  CRON_SECRET: string;
  APP_URL: string;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const appUrl = env.APP_URL ?? "https://mado.blue";
    const res = await fetch(`${appUrl}/api/cron/check-sessions`, {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
    console.log("[mado-cron] check-sessions:", res.status);
  },
};
