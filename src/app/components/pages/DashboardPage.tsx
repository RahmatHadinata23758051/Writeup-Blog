import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { BsPlus, BsTrash, BsArrowLeft, BsFileText } from 'react-icons/bs';
import { WriteUp, Category, Difficulty } from '../../data/writeups';

interface DashboardPageProps {
  onBack: () => void;
}

const categories: Category[] = ['Web', 'Crypto', 'Pwn', 'Forensics', 'Reverse', 'OSINT', 'Misc'];
const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

export function DashboardPage({ onBack }: DashboardPageProps) {
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
    solution: [],
    flag: '',
    lessonsLearned: '',
  });

  const [currentTool, setCurrentTool] = useState('');
  const [currentSolution, setCurrentSolution] = useState({
    title: '',
    content: '',
    code: '',
  });
  const [generatedJson, setGeneratedJson] = useState('');

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

  const addSolution = () => {
    if (currentSolution.title && currentSolution.content) {
      setFormData(prev => ({
        ...prev,
        solution: [
          ...(prev.solution || []),
          {
            title: currentSolution.title,
            content: currentSolution.content,
            code: currentSolution.code || undefined,
          },
        ],
      }));
      setCurrentSolution({ title: '', content: '', code: '' });
    }
  };

  const removeSolution = (index: number) => {
    setFormData(prev => ({
      ...prev,
      solution: (prev.solution || []).filter((_, i) => i !== index),
    }));
  };

  const generateJson = () => {
    if (!formData.id || !formData.title || !formData.ctfName) {
      alert('ID, Title, dan CTF Name harus diisi!');
      return;
    }

    const completeWriteUp: WriteUp = {
      id: formData.id!,
      title: formData.title!,
      category: formData.category as Category,
      difficulty: formData.difficulty as Difficulty,
      points: formData.points || 0,
      date: formData.date!,
      author: formData.author || 'Unknown',
      ctfName: formData.ctfName!,
      description: formData.description!,
      problemDescription: formData.problemDescription!,
      tools: formData.tools || [],
      analysis: formData.analysis!,
      solution: formData.solution || [],
      flag: formData.flag!,
      lessonsLearned: formData.lessonsLearned!,
    };

    const json = JSON.stringify(completeWriteUp, null, 2);
    setGeneratedJson(json);
    console.log(json);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedJson);
    alert('JSON copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 -ml-2"
        >
          <BsArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <BsFileText className="text-primary" />
          Write-Up Dashboard
        </h1>
        <p className="text-muted-foreground mb-8">Template untuk membuat write-up baru</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">ID</label>
                    <Input
                      name="id"
                      placeholder="web-sqli-1"
                      value={formData.id || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Title</label>
                    <Input
                      name="title"
                      placeholder="Challenge Title"
                      value={formData.title || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <select
                      value={formData.category || 'Web'}
                      onChange={(e) => handleSelectChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Difficulty</label>
                    <select
                      value={formData.difficulty || 'Medium'}
                      onChange={(e) => handleSelectChange('difficulty', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      {difficulties.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Points</label>
                    <Input
                      name="points"
                      type="number"
                      placeholder="0"
                      value={formData.points || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Author</label>
                    <Input
                      name="author"
                      placeholder="Your Name"
                      value={formData.author || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">CTF Name</label>
                    <Input
                      name="ctfName"
                      placeholder="CTF Event"
                      value={formData.ctfName || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <Input
                    name="date"
                    type="date"
                    value={formData.date || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    name="description"
                    placeholder="Deskripsi singkat..."
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
                  <label className="text-sm font-medium mb-1 block">Problem Description</label>
                  <Textarea
                    name="problemDescription"
                    placeholder="Penjelasan soal..."
                    value={formData.problemDescription || ''}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Analysis</label>
                  <Textarea
                    name="analysis"
                    placeholder="Analisis vulnerability..."
                    value={formData.analysis || ''}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Solution Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-2 border-blue-500 pl-3 py-2 space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Step Title</label>
                    <Input
                      placeholder="Contoh: Initial Reconnaissance"
                      value={currentSolution.title}
                      onChange={(e) => setCurrentSolution(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Step Content</label>
                    <Textarea
                      placeholder="Penjelasan step ini..."
                      value={currentSolution.content}
                      onChange={(e) => setCurrentSolution(prev => ({
                        ...prev,
                        content: e.target.value
                      }))}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Code/Command (optional)</label>
                    <Textarea
                      placeholder="Code atau command..."
                      value={currentSolution.code}
                      onChange={(e) => setCurrentSolution(prev => ({
                        ...prev,
                        code: e.target.value
                      }))}
                      rows={2}
                    />
                  </div>
                  <Button onClick={addSolution} className="w-full">
                    <BsPlus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Steps ({(formData.solution || []).length})</p>
                  {(formData.solution || []).map((sol, idx) => (
                    <div key={idx} className="border rounded p-3 bg-muted/30">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{idx + 1}. {sol.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {sol.content.substring(0, 50)}...
                          </p>
                        </div>
                        <button
                          onClick={() => removeSolution(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <BsTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tools & Flag</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tools</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Burp Suite"
                      value={currentTool}
                      onChange={(e) => setCurrentTool(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTool()}
                    />
                    <Button onClick={addTool} size="sm">
                      <BsPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.tools || []).map((tool, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tool}
                        <button onClick={() => removeTool(idx)} className="ml-1">
                          <BsTrash className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Flag</label>
                  <Input
                    name="flag"
                    placeholder="flag{...}"
                    value={formData.flag || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Lessons Learned</label>
                  <Textarea
                    name="lessonsLearned"
                    placeholder="Pembelajaran..."
                    value={formData.lessonsLearned || ''}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={generateJson} className="w-full bg-green-600 hover:bg-green-700">
              Generate JSON
            </Button>
          </div>

          {/* Output */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Generated JSON</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedJson ? (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded text-xs font-mono max-h-96 overflow-y-auto">
                      <pre>{generatedJson}</pre>
                    </div>
                    <Button onClick={copyToClipboard} className="w-full">
                      Copy JSON
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-2">Cara pakai:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Copy JSON</li>
                        <li>Buka src/app/data/writeups.ts</li>
                        <li>Paste ke array writeups[]</li>
                        <li>Save file</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Isi form terus klik Generate
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
