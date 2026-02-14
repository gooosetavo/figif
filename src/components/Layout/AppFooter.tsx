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
        {hasDonationLinks && (
          <>
            {' | '}
            {[
            import.meta.env.VITE_BUYMEACOFFEE_USERNAME && (
              <a
                key="buymeacoffee"
                href={`https://buymeacoffee.com/${import.meta.env.VITE_BUYMEACOFFEE_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="donation-link"
                title="Buy Me a Coffee"
              >
                <svg className="donation-icon" viewBox="0 0 884 1279" xmlns="http://www.w3.org/2000/svg">
                  <path d="M791.109 297.518L790.231 297.002C793.531 293.002 795.231 288.102 795.231 282.302C795.231 274.302 792.131 266.902 786.731 261.502L757.031 231.802C751.431 226.202 743.831 223.102 735.631 223.102C727.431 223.102 719.831 226.202 714.231 231.802L684.531 261.502C679.131 266.902 676.031 274.302 676.031 282.302C676.031 288.102 677.831 293.002 681.031 297.002L680.231 297.502C665.431 307.802 652.531 321.702 643.031 337.902C634.831 351.902 628.531 367.202 625.131 383.402L559.131 586.802C556.131 597.402 554.531 608.202 554.531 619.102C554.531 652.802 567.431 684.902 590.731 709.002C613.531 732.602 644.531 747.102 678.431 747.102C679.431 747.102 680.531 747.102 681.631 747.002C691.831 746.702 701.831 744.802 711.431 741.302L849.331 687.502C863.031 681.702 875.431 673.002 885.531 661.802C901.431 643.702 911.231 620.802 911.231 596.102C911.231 584.402 909.131 572.902 905.031 562.002L791.109 297.518Z" fill="currentColor"/>
                  <path d="M264.931 1186.5H382.931C399.431 1186.5 412.831 1173.1 412.831 1156.6V1017.1C421.231 1013.2 429.331 1008.6 437.131 1003.2C444.831 997.902 452.331 991.902 459.531 985.302C466.831 978.602 473.831 971.302 480.531 963.502C487.131 955.702 493.331 947.402 499.131 938.702C504.831 930.002 510.231 920.902 515.231 911.402C520.131 901.902 524.631 891.902 528.631 881.502C532.631 871.102 536.131 860.302 539.031 849.202C541.931 838.102 544.231 826.602 545.931 814.802C547.631 803.002 548.631 790.902 548.631 778.502V387.502C548.631 373.802 546.631 360.302 542.731 347.102C538.831 333.902 533.131 321.302 525.631 309.502C518.131 297.702 508.931 286.802 498.131 276.902C487.331 267.002 475.131 258.302 461.631 250.902C448.131 243.502 433.431 237.402 417.531 232.702C401.631 228.002 384.631 225.602 366.631 225.602H264.931C248.431 225.602 235.031 239.002 235.031 255.502V1156.6C235.031 1173.1 248.431 1186.5 264.931 1186.5Z" fill="currentColor"/>
                </svg>
              </a>
            ),
            import.meta.env.VITE_KOFI_USERNAME && (
              <a
                key="kofi"
                href={`https://ko-fi.com/${import.meta.env.VITE_KOFI_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="donation-link"
                title="Ko-fi"
              >
                <svg className="donation-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" fill="currentColor"/>
                </svg>
              </a>
            ),
            import.meta.env.VITE_GITHUB_SPONSORS_USERNAME && (
              <a
                key="github-sponsors"
                href={`https://github.com/sponsors/${import.meta.env.VITE_GITHUB_SPONSORS_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="donation-link"
                title="GitHub Sponsors"
              >
                <svg className="donation-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                  <path d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z" fill="currentColor"/>
                </svg>
              </a>
            ),
            import.meta.env.VITE_PATREON_USERNAME && (
              <a
                key="patreon"
                href={`https://patreon.com/${import.meta.env.VITE_PATREON_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="donation-link"
                title="Patreon"
              >
                <svg className="donation-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" fill="currentColor"/>
                </svg>
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
