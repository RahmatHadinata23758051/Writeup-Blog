import { BsGithub, BsLinkedin, BsEnvelopeFill, BsLightningCharge } from 'react-icons/bs';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/30 bg-black/30 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BsLightningCharge className="h-5 w-5 text-primary" />
              <span className="text-foreground font-mono">RBLX-Labs Segfault</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional CTF write-ups curated and published by RBLX-Labs Segfault.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Write-Ups
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="mb-4 text-sm text-foreground">Connect</h4>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <BsGithub className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <BsLinkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@example.com"
                className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <BsEnvelopeFill className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground mb-2">
            © {currentYear} RBLX-Labs Segfault. All rights reserved.
          </p>
          <p className="text-center text-xs text-muted-foreground/70">
            All write-ups are curated and published by RBLX-Labs Segfault
          </p>
        </div>
      </div>
    </footer>
  );
}