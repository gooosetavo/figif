export const AppFooter = () => {
  return (
    <footer className="app-footer">
      <p>
        Made with ❤️ | All processing happens in your browser
        {import.meta.env.VITE_GITHUB_URL && (
          <>
            {' | '}
            <a
              href={import.meta.env.VITE_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Source Code
            </a>
            {' | '}
            <a
              href={`${import.meta.env.VITE_GITHUB_URL}/issues`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Report Issue
            </a>
          </>
        )}
      </p>
      {import.meta.env.VITE_COMMIT_SHA && (
        <p className="build-info">
          Build:{' '}
          {import.meta.env.VITE_GITHUB_URL ? (
            <a
              href={`${import.meta.env.VITE_GITHUB_URL}/commit/${import.meta.env.VITE_COMMIT_SHA}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {import.meta.env.VITE_COMMIT_SHA.substring(0, 7)}
            </a>
          ) : (
            import.meta.env.VITE_COMMIT_SHA.substring(0, 7)
          )}
          {import.meta.env.VITE_BUILD_DATE && (
            <> • {new Date(import.meta.env.VITE_BUILD_DATE).toLocaleDateString()}</>
          )}
        </p>
      )}
    </footer>
  );
};
