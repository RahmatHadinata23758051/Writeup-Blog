import { BsCodeSlash, BsShield, BsBook, BsTrophy } from 'react-icons/bs';
import { writeups } from '../../data/writeups';

export function AboutPage() {
  // Calculate stats dynamically
  const totalWriteUps = writeups.length;
  const totalPoints = writeups.reduce((sum, writeup) => sum + writeup.points, 0);
  const categories = new Set(writeups.map(writeup => writeup.category)).size;

  const skills = [
    'Web Application Security',
    'Cryptography',
    'Binary Exploitation',
    'Forensics Analysis',
    'Reverse Engineering',
    'OSINT',
    'Network Security',
    'Penetration Testing',
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-foreground">About RBLX-Labs Segfault</h1>
          <p className="text-muted-foreground">
            Our team's journey in cybersecurity and CTF competitions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Introduction */}
        <section className="mb-12 rounded-lg border border-border bg-card p-8">
          <div className="mb-6 flex justify-center">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
              <BsCodeSlash className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h2 className="mb-4 text-center text-foreground">Welcome</h2>
          <p className="mb-4 text-center text-foreground/90">
            RBLX-Labs Segfault is a dedicated cybersecurity team passionate about solving CTF 
            challenges and advancing our knowledge in offensive security. This platform serves 
            as our official archive of write-ups, technical insights, and research notes from 
            various competitions and security investigations.
          </p>
          <p className="mb-4 text-center text-foreground/90">
            All content published here is carefully curated by our team members. We maintain this 
            read-only archive to share knowledge with the cybersecurity community, demonstrate our 
            technical expertise, and provide valuable resources for fellow security enthusiasts and 
            researchers.
          </p>
          <p className="text-center text-foreground/90">
            Our write-ups are designed to be educational, detailed, and professional - suitable for 
            learning, reference, and demonstrating our problem-solving capabilities to recruiters and 
            judges in the cybersecurity field.
          </p>
        </section>

        {/* Focus Areas */}
        <section className="mb-12">
          <h2 className="mb-6 flex items-center gap-2 text-foreground">
            <BsShield className="h-6 w-6 text-primary" />
            Focus Areas
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 text-foreground">CTF Competitions</h3>
              <p className="text-sm text-muted-foreground">
                Actively participating in Capture The Flag competitions to sharpen
                our skills across various security domains.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 text-foreground">Security Research</h3>
              <p className="text-sm text-muted-foreground">
                Exploring vulnerabilities, studying exploitation techniques, and
                understanding defensive measures.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 text-foreground">Continuous Learning</h3>
              <p className="text-sm text-muted-foreground">
                Constantly learning new attack vectors, defense strategies, and
                staying updated with the latest security trends.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 text-foreground">Knowledge Sharing</h3>
              <p className="text-sm text-muted-foreground">
                Contributing to the cybersecurity community through detailed
                write-ups and educational content.
              </p>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className="mb-12">
          <h2 className="mb-6 flex items-center gap-2 text-foreground">
            <BsBook className="h-6 w-6 text-primary" />
            Skills & Expertise
          </h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-all hover:border-primary/50"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section>
          <h2 className="mb-6 flex items-center gap-2 text-foreground">
            <BsTrophy className="h-6 w-6 text-primary" />
            Achievements
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-foreground">Total Write-Ups</h3>
                <span className="text-2xl text-primary">{totalWriteUps}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Documented solutions across multiple CTF competitions
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-foreground">Total Points</h3>
                <span className="text-2xl text-primary">{totalPoints.toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Accumulated points from solved challenges
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-foreground">Categories Covered</h3>
                <span className="text-2xl text-primary">{categories}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Diverse experience across Web, Crypto, Pwn, Forensics, Reverse, and OSINT
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}