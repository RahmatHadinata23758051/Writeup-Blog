import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { WriteUp, Category, Difficulty } from '../../data/writeups';

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
    solution: [],
    flag: '',
    lessonsLearned: '',
  });

  const [currentTool, setCurrentTool] = useState('');

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
