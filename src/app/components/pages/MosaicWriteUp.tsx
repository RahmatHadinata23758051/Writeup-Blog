/**
 * The Mosaic - Complete Write-Up dengan visualisasi formula dan proses step-by-step
 * Challenge: Reconstruct puzzle dari 100 PNG file fragments
 */

import React, { useState } from 'react';
import { BsArrowRight, BsCheck, BsX } from 'react-icons/bs';
import { MathRenderer, MathBlock } from '../MathRenderer';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function MosaicWriteUp() {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const Section = ({ 
    id, 
    title, 
    children 
  }: { 
    id: string; 
    title: string; 
    children: React.ReactNode 
  }) => (
    <div className="mb-12 border-l-4 border-purple-500/30 pl-6">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="flex items-center space-x-3 w-full hover:opacity-80 transition"
      >
        <h2 className="text-2xl font-bold text-purple-300">{title}</h2>
        <span className="text-sm text-slate-400">
          {expandedSection === id ? '▼' : '▶'}
        </span>
      </button>
      {expandedSection === id && (
        <div className="mt-6 space-y-6">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center space-x-4 mb-4">
            <Badge className="bg-purple-600 hover:bg-purple-700">Misc</Badge>
            <Badge className="bg-yellow-600 hover:bg-yellow-700">Medium</Badge>
            <Badge className="bg-slate-700 hover:bg-slate-600">beginner.m0lecon</Badge>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            The Mosaic
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            A puzzle reconstruction challenge combining image forensics, metadata extraction, binary analysis, and cryptography. 100 PNG fragments must be reassembled, decoded, and reverse-engineered to find the flag.
          </p>
        </div>

        {/* Challenge Overview */}
        <Section id="overview" title="🎯 Challenge Overview">
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-bold text-cyan-300 mb-3">Challenge Description</h3>
              <p className="text-slate-300 leading-relaxed">
                We are given 100 PNG image files with random filenames. The problem statement mentions "labels on the back of the canvas" and tasking us to restore a broken "masterpiece" before an exhibition opens. One image comment hints: "Reconstruct the timeline to find the truth."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400 mb-2">100</div>
                <div className="text-sm text-slate-400">PNG Image Fragments</div>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400 mb-2">5</div>
                <div className="text-sm text-slate-400">Solution Stages</div>
              </div>
              <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-pink-400 mb-2">3</div>
                <div className="text-sm text-slate-400">Red Herrings</div>
              </div>
            </div>
          </div>
        </Section>

        {/* Tools & Concepts */}
        <Section id="tools" title="🔧 Tools & Concepts">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['exiftool', 'Python PIL', 'Ghidra', 'objdump', 'Binary Analysis', 'XOR Decryption'].map((tool) => (
                <div
                  key={tool}
                  className="flex items-center space-x-3 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg"
                >
                  <span className="text-cyan-400">◆</span>
                  <span className="text-slate-300">{tool}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-bold text-cyan-300 mb-3">Core Concepts</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start space-x-3">
                  <span className="text-purple-400 mt-1">→</span>
                  <span><strong>Image Metadata:</strong> PNG EXIF tags containing coordinate information</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-purple-400 mt-1">→</span>
                  <span><strong>File Format Identification:</strong> Magic bytes and ELF header detection</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-purple-400 mt-1">→</span>
                  <span><strong>Binary Reverse Engineering:</strong> Static analysis of executable code</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-purple-400 mt-1">→</span>
                  <span><strong>XOR Cryptanalysis:</strong> Recovering key from encrypted data</span>
                </li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Red Herrings & Misdirection */}
        <Section id="analysis" title="⚠️ Analysis - Red Herrings">
          <div className="space-y-6">
            <div className="bg-orange-900/20 border-l-4 border-orange-500 rounded-lg p-6">
              <h3 className="font-bold text-orange-300 mb-3 flex items-center space-x-2">
                <BsX className="text-lg" />
                <span>Trap #1: Timeline Misdirection</span>
              </h3>
              <p className="text-slate-300 mb-4">
                Challenge hint: "Reconstruct the timeline to find the truth"
              </p>
              <div className="bg-slate-900/50 rounded p-4 mb-4 border border-slate-700/50">
                <p className="text-sm text-slate-300">
                  <strong>Initial Approach:</strong> Sort 100 PNG files by modification timestamp and reconstruct.
                </p>
              </div>
              <p className="text-slate-300">
                <strong className="text-red-400">Why It Failed:</strong> All files have identical timestamps. The "timeline" refers to internal data order, not file modification times.
              </p>
            </div>

            <div className="bg-orange-900/20 border-l-4 border-orange-500 rounded-lg p-6">
              <h3 className="font-bold text-orange-300 mb-3 flex items-center space-x-2">
                <BsX className="text-lg" />
                <span>Trap #2: Wrong Metadata Tags</span>
              </h3>
              <p className="text-slate-300">
                Attempted multiple EXIF tags before finding the correct one. Tools like `exiftool` show hundreds of possible tags—guessing wastes time.
              </p>
            </div>

            <div className="bg-orange-900/20 border-l-4 border-orange-500 rounded-lg p-6">
              <h3 className="font-bold text-orange-300 mb-3 flex items-center space-x-2">
                <BsX className="text-lg" />
                <span>Trap #3: Image Analysis Rabbit Hole</span>
              </h3>
              <p className="text-slate-300">
                Looking at visual patterns in the fragments before checking metadata leads nowhere. Metadata extraction comes first!
              </p>
            </div>
          </div>
        </Section>

        {/* Solution Steps */}
        <Section id="solution" title="✅ Solution - Step-by-Step">
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="bg-gradient-to-r from-purple-900/20 to-slate-800/20 border border-purple-500/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-purple-300">Extract Metadata</h3>
              </div>
              <p className="text-slate-300 mb-4">
                Use exiftool to extract the "Frag_ID" tags from all PNG files. These contain coordinate information (X, Y) indicating where each piece belongs in the puzzle.
              </p>
              <div className="bg-slate-900 rounded-lg p-4 mb-4 border border-slate-700 font-mono text-sm">
                <div className="text-cyan-400 mb-2">$ exiftool -p '$Frag_ID|$FileName' -q -ext png . &gt; map_final.txt</div>
                <div className="text-slate-400">Output format: X|Y|filename (example: 5|6|zbcb9rjm.png)</div>
              </div>
              <MathBlock
                title="Coordinate System"
                formula="(X, Y) \\text{ where } 0 \\leq X, Y < 10 \\text{ (10x10 grid)}"
                variant="subtle"
              />
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-r from-blue-900/20 to-slate-800/20 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-blue-300">Reconstruct Puzzle</h3>
              </div>
              <p className="text-slate-300 mb-4">
                Create a Python script using PIL (Python Imaging Library) to assemble all 100 fragments according to their coordinates.
              </p>
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 font-mono text-sm overflow-x-auto">
                <code className="text-green-400">{`from PIL import Image
import os

# Read coordinate map
pieces = {}
with open('map_final.txt', 'r') as f:
    for line in f:
        x, y, filename = line.strip().split('|')
        pieces[(int(x), int(y))] = Image.open(filename)

# Create 10x10 grid, assemble puzzle
width = max(x for x, y in pieces) + 1
height = max(y for x, y in pieces) + 1
result = Image.new('RGB', (width * 100, height * 100))

for (x, y), img in pieces.items():
    result.paste(img, (x * 100, y * 100))

result.save('flag_reconstructed.png')`}</code>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gradient-to-r from-green-900/20 to-slate-800/20 border border-green-500/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-green-300">Extract Raw Binary Data</h3>
              </div>
              <p className="text-slate-300 mb-4">
                The reconstructed image contains the flag but it's encoded as raw binary data. Convert image pixels to bytes.
              </p>
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 font-mono text-sm">
                <code className="text-green-400">{`img = Image.open('flag_reconstructed.png').convert('RGB')
data = img.tobytes()
with open('data.bin', 'wb') as f:
    f.write(data)`}</code>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-gradient-to-r from-cyan-900/20 to-slate-800/20 border border-cyan-500/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="text-xl font-bold text-cyan-300">File Type Identification</h3>
              </div>
              <p className="text-slate-300 mb-4">
                Check what format the extracted binary is. A surprise awaits!
              </p>
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 font-mono text-sm">
                <code className="text-cyan-400">$ file data.bin</code>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 mt-3 border-l-4 border-cyan-500">
                <p className="text-cyan-300 font-mono">data.bin: ELF 64-bit LSB executable, x86-64, ...</p>
              </div>
              <p className="text-slate-300 mt-4">
                The binary is actually an ELF executable! Now we need to reverse engineer it.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-gradient-to-r from-pink-900/20 to-slate-800/20 border border-pink-500/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center font-bold">
                  5
                </div>
                <h3 className="text-xl font-bold text-pink-300">Reverse Engineering & XOR Decryption</h3>
              </div>
              <p className="text-slate-300 mb-4">
                The binary has anti-debugging measures (sleeps). Use static analysis with objdump instead of running it directly.
              </p>

              <div className="space-y-4 mt-4">
                <MathBlock
                  title="Key Discovery"
                  formula="\\text{mov DWORD PTR [rbp-0x38], 0x42} \\rightarrow \\text{XOR Key} = 0x42"
                  variant="highlight"
                  description="Found in assembly code via objdump"
                />

                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <p className="text-sm font-bold text-slate-300 mb-2">Extract Encrypted Data:</p>
                  <div className="font-mono text-xs text-cyan-400 space-y-1 overflow-x-auto">
                    <div>target_pattern = b'\\x32\\x36\\x2f\\x39\\x73\\x36\\x31\\x1d'</div>
                    <div>data_offset = content.find(target_pattern)</div>
                    <div># Extract blocks at specific offsets</div>
                    <div>block1 = content[data_offset : data_offset + 8]</div>
                    <div>block2 = content[data_offset + 10 : data_offset + 18]</div>
                    <div># ... more blocks ...</div>
                  </div>
                </div>

                <MathBlock
                  title="XOR Decryption"
                  formula="\\text{flag}[i] = \\text{encrypted}[i] \\oplus 0x42"
                  variant="default"
                  description="Apply XOR with key 0x42 to decrypt each byte"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Key Insights */}
        <Section id="lessons" title="💡 Key Insights & Lessons">
          <div className="space-y-6">
            <div className="bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6">
              <h3 className="font-bold text-yellow-300 mb-3">1. Start with Metadata</h3>
              <p className="text-slate-300">
                Always inspect file metadata and EXIF tags before diving into complex analysis. The solution often hides in plain sight within metadata.
              </p>
            </div>

            <div className="bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6">
              <h3 className="font-bold text-yellow-300 mb-3">2. Recognize File Format Signatures</h3>
              <p className="text-slate-300">
                Magic bytes (file signatures) are your friend. Tools like <code className="bg-slate-800 px-2 py-1 rounded">file</code> command immediately identify the format, saving hours of guessing.
              </p>
            </div>

            <div className="bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6">
              <h3 className="font-bold text-yellow-300 mb-3">3. Static Analysis Over Dynamic</h3>
              <p className="text-slate-300">
                When anti-debugging measures exist, static analysis (objdump, Ghidra) is more efficient than trying to run the binary.
              </p>
            </div>

            <div className="bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6">
              <h3 className="font-bold text-yellow-300 mb-3">4. Simple Cryptography Patterns</h3>
              <p className="text-slate-300">
                In CTF challenges, if XOR appears, the key is often hardcoded in the binary. Assembly instructions can reveal secrets directly.
              </p>
            </div>

            <div className="bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6">
              <h3 className="font-bold text-yellow-300 mb-3">5. Challenge Design Intent</h3>
              <p className="text-slate-300">
                Multi-stage challenges are designed to teach layered problem-solving. Each stage builds on previous knowledge: image forensics → binary analysis → reverse engineering → cryptanalysis.
              </p>
            </div>
          </div>
        </Section>

        {/* Flag */}
        <div className="mt-16 p-8 bg-gradient-to-r from-green-900/30 to-slate-800/30 border-2 border-green-500/50 rounded-lg">
          <h2 className="text-2xl font-bold text-green-300 mb-4 flex items-center space-x-2">
            <BsCheck className="text-2xl" />
            <span>Flag</span>
          </h2>
          <div className="font-mono text-2xl text-green-400 bg-slate-950 p-4 rounded border border-green-500/30 break-all">
            ptm{'{'}<span className="text-yellow-400">1ts_ju5t_pngs_4ll_th3_w4y_d0wn</span>{'}'}
          </div>
          <p className="text-slate-400 text-sm mt-4 italic">
            "It's just PNGs all the way down" — A playful reference to nested data formats and turtles meme.
          </p>
        </div>

        {/* Difficulty Breakdown */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <div className="text-sm font-bold text-purple-400 mb-3">📊 Difficulty Estimate</div>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Image Forensics</span>
                <span className="text-purple-400">⭐⭐</span>
              </div>
              <div className="flex justify-between">
                <span>Binary Analysis</span>
                <span className="text-purple-400">⭐⭐⭐</span>
              </div>
              <div className="flex justify-between">
                <span>Reverse Engineering</span>
                <span className="text-purple-400">⭐⭐</span>
              </div>
              <div className="flex justify-between">
                <span>Cryptography</span>
                <span className="text-purple-400">⭐</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <div className="text-sm font-bold text-blue-400 mb-3">⏱️ Time Estimate</div>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Initial Analysis</span>
                <span className="text-blue-400">30 min</span>
              </div>
              <div className="flex justify-between">
                <span>Metadata Extraction</span>
                <span className="text-blue-400">20 min</span>
              </div>
              <div className="flex justify-between">
                <span>Reverse Engineering</span>
                <span className="text-blue-400">45 min</span>
              </div>
              <div className="flex justify-between">
                <span>Flag Extraction</span>
                <span className="text-blue-400">15 min</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <div className="text-sm font-bold text-cyan-400 mb-3">🎓 Skills Learned</div>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>✓ EXIF metadata analysis</li>
              <li>✓ Image reconstruction</li>
              <li>✓ Binary format analysis</li>
              <li>✓ Static reverse engineering</li>
              <li>✓ XOR cryptanalysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
