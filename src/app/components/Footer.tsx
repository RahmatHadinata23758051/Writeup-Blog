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
                href="https://github.com/RahmatHadinata23758051"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <BsGithub className="h-5 w-5" />
              </a>
              <a
                href="https://medium.com/@rsafei731"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary flex items-center justify-center"
                aria-label="Medium"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" fillRule="evenodd" clipRule="evenodd"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm-2.426 14.741h-3.574v-.202l1.261-1.529c.134-.139.195-.335.162-.526v-5.304c.015-.147-.041-.293-.151-.392l-1.121-1.35v-.201h3.479l2.689 5.897 2.364-5.897h3.317v.201l-.958.919c-.083.063-.124.166-.106.269v6.748c-.018.103.023.206.106.269l.936.919v.201h-4.706v-.201l.969-.941c.095-.095.095-.123.095-.269v-5.455l-2.695 6.844h-.364l-3.137-6.844v4.587c-.026.193.038.387.174.526l1.26 1.529v.202z"/></svg>
              </a>
              <a
                href="https://www.linkedin.com/in/rahmat-hadinata-iet/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <BsLinkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:rhnata25@gmail.com"
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