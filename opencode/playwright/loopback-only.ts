const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"])

export default async ({ page }) => {
  await page.context().route("**/*", async (route) => {
    const url = new URL(route.request().url())

    if (!url.hostname || loopbackHosts.has(url.hostname)) {
      await route.continue()
      return
    }

    await route.abort("blockedbyclient")
  })
}
