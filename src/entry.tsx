const target = import.meta.env.VITE_TARGET || "mobile";

if (target === "web") {
  import("./web/main");
} else {
  import("./main");
}
