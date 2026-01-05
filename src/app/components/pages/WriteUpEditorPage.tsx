import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { WriteUp, Category, Difficulty, MathFormula } from '../../data/writeups';

interface WriteUpEditorPageProps {
  onBack: () => void;
}

const categories: Category[] = ['Web', 'Crypto', 'Pwn', 'Forensics', 'Reverse', 'OSINT', 'Misc'];
const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

export function WriteUpEditorPage({ onBack }: WriteUpEditorPageProps) {
  const [formData, setFormData] = useState<Partial<WriteUp>>({
    id: '',
    title: '',
    category: 'Web',
    difficulty: 'Medium',
    points: 0,
    date: new Date().toISOString().split('T')[0],
    author: '',
    ctfName: '',
    description: '',
    problemDescription: '',
    tools: [],
    analysis: '',
    mathAnalysis: [],
    solution: [],
    flag: '',
    lessonsLearned: '',
  });

  const [currentTool, setCurrentTool] = useState('');
  const [currentFormula, setCurrentFormula] = useState<Partial<MathFormula>>({
    title: '',
    formula: '',
    description: '',
    variant: 'default',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const addTool = () => {
    if (currentTool.trim()) {
      setFormData(prev => ({
        ...prev,
        tools: [...(prev.tools || []), currentTool],
      }));
      setCurrentTool('');
    }
  };

  const removeTool = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tools: (prev.tools || []).filter((_, i) => i !== index),
    }));
  };

  const addFormula = () => {
    if (currentFormula.formula?.trim() && currentFormula.title?.trim()) {
      setFormData(prev => ({
        ...prev,
        mathAnalysis: [...(prev.mathAnalysis || []), currentFormula as MathFormula],
      }));
      setCurrentFormula({
        title: '',
        formula: '',
        description: '',
        variant: 'default',
      });
    }
  };

  const removeFormula = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mathAnalysis: (prev.mathAnalysis || []).filter((_, i) => i !== index),
    }));
  };

  const handleFormulaChange = (field: keyof MathFormula, value: string) => {
    setCurrentFormula(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.id || !formData.title || !formData.ctfName) {
      alert('Pastikan ID, Title, dan CTF Name terisi!');
      return;
    }

    const completeWriteUp: WriteUp = {
      id: formData.id!,
      title: formData.title!,
      category: formData.category as Category,
      difficulty: formData.difficulty as Difficulty,
      points: formData.points || 0,
      date: formData.date!,
      author: formData.author || '',
      ctfName: formData.ctfName!,
      description: formData.description!,
      problemDescription: formData.problemDescription!,
      tools: formData.tools || [],
      analysis: formData.analysis!,
      solution: [],
      flag: formData.flag!,
      lessonsLearned: formData.lessonsLearned!,
    };

    console.log(JSON.stringify(completeWriteUp, null, 2));
    alert('Write-up berhasil dibuat! Lihat browser console untuk JSON.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <h1 className="text-4xl font-bold mb-2">📝 Write-Up Editor</h1>
          <p className="text-muted-foreground">Buat write-up baru dengan template yang sudah siap</p>
        </div>

        <div className="space-y-8">
          {/* Formula Template Guide */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📐 Template: Menambahkan Rumus Matematika
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Tambahkan rumus matematika di section Analysis. Gunakan format JSON di bawah untuk field <code className="bg-muted px-2 py-1 rounded text-xs">mathAnalysis</code>:
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Template JSON:</h4>
                  <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">
{`"mathAnalysis": [
  {
    "title": "Nama Rumus",
    "formula": "a^2 + b^2 = c^2",
    "description": "Penjelasan rumus ini",
    "variant": "highlight"
  },
  {
    "title": "Rumus Kedua",
    "formula": "E = mc^2",
    "description": "Persamaan relativitas Einstein",
    "variant": "default"
  }
]`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Panduan LaTeX & Variant:</h4>
                  <div className="space-y-3 text-sm">
                    <div className="bg-muted/50 p-3 rounded">
                      <p className="font-semibold text-xs uppercase mb-1">LaTeX Syntax:</p>
                      <ul className="space-y-1 text-xs list-disc list-inside">
                        <li><code className="bg-muted px-1 rounded">\\frac{'a}{b}'</code> = Pecahan</li>
                        <li><code className="bg-muted px-1 rounded">\\sqrt{'x}'</code> = Akar kuadrat</li>
                        <li><code className="bg-muted px-1 rounded">^2</code> = Pangkat/Superscript</li>
                        <li><code className="bg-muted px-1 rounded">_i</code> = Subscript</li>
                        <li><code className="bg-muted px-1 rounded">\\pmod{'n}'</code> = Modulo</li>
                        <li><code className="bg-muted px-1 rounded">\\equiv</code> = Kongruen</li>
                        <li><code className="bg-muted px-1 rounded">\\sum</code> = Sigma/Jumlah</li>
                      </ul>
                    </div>

                    <div className="bg-muted/50 p-3 rounded">
                      <p className="font-semibold text-xs uppercase mb-1">Variant (Styling):</p>
                      <ul className="space-y-1 text-xs">
                        <li><code className="bg-yellow-900/50 px-2 py-1 rounded">"default"</code> - Background gelap biasa</li>
                        <li><code className="bg-purple-900/50 px-2 py-1 rounded">"highlight"</code> - Gradient purple-blue (penting!)</li>
                        <li><code className="bg-slate-900/50 px-2 py-1 rounded">"subtle"</code> - Styling minimal</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Contoh Rumus Umum:</h4>
                  <div className="space-y-2 text-xs">
                    <div className="bg-muted/50 p-2 rounded font-mono">
                      <p><span className="text-blue-400">RSA Encryption:</span> c \\equiv m^e \\pmod{'n}'</p>
                    </div>
                    <div className="bg-muted/50 p-2 rounded font-mono">
                      <p><span className="text-blue-400">DLP:</span> g^x \\equiv h \\pmod{'p}'</p>
                    </div>
                    <div className="bg-muted/50 p-2 rounded font-mono">
                      <p><span className="text-blue-400">Integral:</span> \\int_0^{\\pi} \\sin(x) dx</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/20 border border-blue-500/50 p-3 rounded text-sm">
                <p className="font-semibold mb-1">💡 Tips:</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>Selalu gunakan backslash ganda (<code className="bg-muted px-1 rounded">\\\\</code>) untuk escape di JSON</li>
                  <li>Test rumus dengan copy-paste ke <a href="https://www.desmos.com/" target="_blank" className="text-blue-400 hover:underline">Desmos</a></li>
                  <li>Gunakan <code className="bg-muted px-1 rounded">"highlight"</code> untuk rumus utama yang penting</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ID</label>
                  <Input
                    name="id"
                    placeholder="web-sqli-1"
                    value={formData.id || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    name="title"
                    placeholder="Challenge Title"
                    value={formData.title || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={formData.category || 'Web'}
                    onChange={(e) => handleSelectChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty || 'Medium'}
                    onChange={(e) => handleSelectChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {difficulties.map(diff => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Points</label>
                <Input
                  name="points"
                  type="number"
                  placeholder="300"
                  value={formData.points || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Author</label>
                  <Input
                    name="author"
                    placeholder="Your Name"
                    value={formData.author || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CTF Name</label>
                  <Input
                    name="ctfName"
                    placeholder="CTF Event Name"
                    value={formData.ctfName || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                  name="date"
                  type="date"
                  value={formData.date || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  name="description"
                  placeholder="Deskripsi singkat"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Problem & Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Problem Description</label>
                <Textarea
                  name="problemDescription"
                  placeholder="Penjelasan detail soal..."
                  value={formData.problemDescription || ''}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Analysis</label>
                <Textarea
                  name="analysis"
                  placeholder="Analisis detail..."
                  value={formData.analysis || ''}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📐 Mathematical Analysis (Formulas)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Formula Title</label>
                  <Input
                    placeholder="e.g., RSA Encryption"
                    value={currentFormula.title || ''}
                    onChange={(e) => handleFormulaChange('title', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">LaTeX Formula</label>
                  <Input
                    placeholder="e.g., c \\equiv m^e \\pmod{n}"
                    value={currentFormula.formula || ''}
                    onChange={(e) => handleFormulaChange('formula', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <Textarea
                    placeholder="Penjelasan rumus..."
                    value={currentFormula.description || ''}
                    onChange={(e) => handleFormulaChange('description', e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Variant Style</label>
                  <select
                    value={currentFormula.variant || 'default'}
                    onChange={(e) => handleFormulaChange('variant', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="default">Default (Gelap)</option>
                    <option value="highlight">Highlight (Purple-Blue Gradient)</option>
                    <option value="subtle">Subtle (Minimal)</option>
                  </select>
                </div>

                <Button
                  onClick={addFormula}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Formula
                </Button>
              </div>

              {formData.mathAnalysis && formData.mathAnalysis.length > 0 && (
                <div className="space-y-3 mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-sm">Added Formulas ({formData.mathAnalysis.length})</h4>
                  <div className="space-y-2">
                    {formData.mathAnalysis.map((formula, index) => (
                      <div key={index} className="flex items-start justify-between gap-3 p-3 bg-muted rounded-lg">
                        <div className="flex-1 text-sm">
                          <p className="font-semibold text-foreground">{formula.title}</p>
                          <p className="text-muted-foreground font-mono text-xs mt-1">{formula.formula}</p>
                          {formula.description && (
                            <p className="text-muted-foreground text-xs mt-1">{formula.description}</p>
                          )}
                          <Badge className="mt-2 text-xs" variant="outline">
                            {formula.variant}
                          </Badge>
                        </div>
                        <Button
                          onClick={() => removeFormula(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tools Used</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Tambah tool"
                  value={currentTool}
                  onChange={(e) => setCurrentTool(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTool()}
                />
                <Button onClick={addTool}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(formData.tools || []).map((tool, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tool}
                    <button
                      onClick={() => removeTool(idx)}
                      className="ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flag & Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Flag</label>
                <Input
                  name="flag"
                  placeholder="flag{...}"
                  value={formData.flag || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Lessons Learned</label>
                <Textarea
                  name="lessonsLearned"
                  placeholder="Pembelajaran dari challenge ini..."
                  value={formData.lessonsLearned || ''}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={onBack} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
              Save & Generate JSON
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
