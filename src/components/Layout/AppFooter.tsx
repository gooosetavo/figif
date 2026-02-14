export const AppFooter = () => {
  // Check if any donation links are configured
  const hasDonationLinks =
    import.meta.env.VITE_BUYMEACOFFEE_USERNAME ||
    import.meta.env.VITE_KOFI_USERNAME ||
    import.meta.env.VITE_GITHUB_SPONSORS_USERNAME ||
    import.meta.env.VITE_PATREON_USERNAME;

  return (
    <footer className="app-footer">
      <p>
        All processing happens in your browser
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
      {hasDonationLinks && (
        <p className="donation-links">
          Support the project:{' '}
          {[
            import.meta.env.VITE_BUYMEACOFFEE_USERNAME && (
              <a
                key="buymeacoffee"
                href={`https://buymeacoffee.com/${import.meta.env.VITE_BUYMEACOFFEE_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="donation-link"
              >
                <img
                  src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                  alt="Buy Me A Coffee"
                  className="donation-icon"
                />
              </a>
            ),
            import.meta.env.VITE_KOFI_USERNAME && (
              <a
                key="kofi"
                href={`https://ko-fi.com/${import.meta.env.VITE_KOFI_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="donation-link"
              >
                <img
                  src="https://ko-fi.com/img/githubbutton_sm.svg"
                  alt="Ko-fi"
                  className="donation-icon"
                />
              </a>
            ),
            import.meta.env.VITE_GITHUB_SPONSORS_USERNAME && (
              <a
                key="github-sponsors"
                href={`https://github.com/sponsors/${import.meta.env.VITE_GITHUB_SPONSORS_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="donation-link"
              >
                <img
                  src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github"
                  alt="GitHub Sponsors"
                  className="donation-icon"
                />
              </a>
            ),
            import.meta.env.VITE_PATREON_USERNAME && (
              <a
                key="patreon"
                href={`https://patreon.com/${import.meta.env.VITE_PATREON_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="donation-link"
              >
                <img
                  src="https://img.shields.io/badge/Support-Patreon-f96854?logo=patreon"
                  alt="Patreon"
                  className="donation-icon"
                />
              </a>
            ),
          ]
            .filter(Boolean)
            .reduce((acc, link, index, array) => {
              acc.push(link);
              if (index < array.length - 1) {
                acc.push(<span key={`separator-${index}`} className="donation-separator"> </span>);
              }
              return acc;
            }, [] as React.ReactNode[])}
        </p>
      )}
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
