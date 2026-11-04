export default {
  async fetch(request, env) {
    // Every route is handled by the static assets (the game is a single page).
    return env.ASSETS.fetch(request);
  }
};
