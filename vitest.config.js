const config = {
  test: {
    environment: "jsdom",
    include: ["app/**/*.test.{js,ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"]
  }
};

export default config;
