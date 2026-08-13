export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "1rem",
      textAlign: "center",
      padding: "2rem"
    }}>
      <div style={{ fontSize: "5rem", fontWeight: 900, color: "var(--color-gray-700)", lineHeight: 1 }}>404</div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0, color: "var(--color-gray-200)" }}>Page not found</h2>
      <p style={{ color: "var(--color-gray-500)", maxWidth: 400, lineHeight: 1.6 }}>
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <a
        href="/dashboard"
        className="btn btn-primary"
        style={{ marginTop: "1rem" }}
      >
        Back to Dashboard
      </a>
    </div>
  )
}
