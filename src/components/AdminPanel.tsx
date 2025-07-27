import React, { useState, useEffect } from 'react';
import { X, Settings, Users, BookOpen, MessageSquare, Plus, Search, Trash2, Eye, EyeOff, User, Mail, Calendar, UserPlus } from 'lucide-react';
import { isAdmin } from '../utils/adminConfig';
import { getOnboardingVideos, saveOnboardingVideos, getPopupContents, savePopupContents, type OnboardingVideo, type PopupContent } from '../data/onboardingData';
import { bonusResources } from '../data/bonusData';
import { addStudent, getStudents, removeStudent, getStudentStats, searchStudents, type ManualStudent, type CreateStudentData } from '../utils/studentManager';

interface AdminPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  userEmail: string;
}

export default function AdminPanel({ isVisible, onToggle, userEmail }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [videos, setVideos] = useState<OnboardingVideo[]>([]);
  const [popups, setPopups] = useState<PopupContent[]>([]);
  const [bonuses, setBonuses] = useState(bonusResources);
  
  // Student management state
  const [students, setStudents] = useState<ManualStudent[]>([]);
  const [studentStats, setStudentStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    addedThisMonth: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Bonus management state
  const [isAddingBonus, setIsAddingBonus] = useState(false);
  const [newBonus, setNewBonus] = useState({
    title: '',
    description: '',
    type: 'course' as 'course' | 'ebook' | 'guide' | 'audio',
    thumbnail: '',
    totalLessons: 0,
    totalDuration: '',
    rating: 4.5
  });

  // Video management state
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    duration: '',
    embedUrl: '',
    thumbnail: ''
  });

  // Load data on mount
  useEffect(() => {
    if (isVisible) {
      loadData();
      loadStudents();
    }
  }, [isVisible]);

  const loadData = () => {
    setVideos(getOnboardingVideos());
    setPopups(getPopupContents());
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const [studentsData, stats] = await Promise.all([
        getStudents(),
        getStudentStats()
      ]);
      setStudents(studentsData);
      setStudentStats(stats);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await searchStudents(query);
        setStudents(results);
      } catch (error) {
        console.error('Erro na busca:', error);
      }
    } else {
      loadStudents();
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.email.trim()) {
      alert('Nome e email são obrigatórios');
      return;
    }

    try {
      setIsLoading(true);
      const studentData: CreateStudentData = {
        name: newStudent.name.trim(),
        email: newStudent.email.trim().toLowerCase(),
        notes: newStudent.notes.trim(),
        added_by: userEmail
      };
      
      const result = await addStudent(studentData);
      console.log('Aluno adicionado com sucesso:', result);
      
      setNewStudent({ name: '', email: '', notes: '' });
      setIsAddingStudent(false);
      await loadStudents();
      alert('Aluno adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar aluno:', error);
      alert(error instanceof Error ? error.message : 'Erro ao adicionar aluno');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${studentName}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      await removeStudent(studentId);
      await loadStudents();
      alert('Aluno removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      alert('Erro ao remover aluno');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewBonus = () => {
    setIsAddingBonus(true);
  };

  const handleCreateBonus = () => {
    if (!newBonus.title.trim() || !newBonus.description.trim()) {
      alert('Título e descrição são obrigatórios');
      return;
    }

    const bonusId = 'bonus_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const newBonusResource = {
      id: bonusId,
      title: newBonus.title.trim(),
      description: newBonus.description.trim(),
      type: newBonus.type,
      thumbnail: newBonus.thumbnail || 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=800',
      totalLessons: newBonus.totalLessons,
      totalDuration: newBonus.totalDuration || '1h',
      rating: newBonus.rating,
      downloads: 0,
      lessons: [
        {
          id: '1',
          title: 'Aula 1: Introdução',
          description: 'Primeira aula do curso',
          videoUrl: 'https://www.youtube.com/embed/mttHTuEK5Xs',
          duration: '15:00',
          textContent: `# ${newBonus.title}\n\nBem-vindo ao curso! Esta é a primeira aula.\n\n## Conteúdo da Aula\n\nAqui você pode adicionar o conteúdo da aula em markdown.`,
          exercises: [
            {
              id: '1',
              question: 'Esta é uma pergunta de exemplo?',
              options: [
                'Sim, é uma pergunta de exemplo',
                'Não, não é uma pergunta',
                'Talvez seja uma pergunta',
                'Não sei responder'
              ],
              correctAnswer: 0,
              explanation: 'Esta é realmente uma pergunta de exemplo para demonstrar o sistema.'
            }
          ],
          completed: false
        }
      ]
    };

    const updatedBonuses = [...bonuses, newBonusResource];
    setBonuses(updatedBonuses);
    
    // Reset form
    setNewBonus({
      title: '',
      description: '',
      type: 'course',
      thumbnail: '',
      totalLessons: 0,
      totalDuration: '',
      rating: 4.5
    });
    setIsAddingBonus(false);
    
    alert('Bônus criado com sucesso!');
  };

  const handleAddVideo = () => {
    if (!newVideo.title.trim() || !newVideo.embedUrl.trim()) {
      alert('Título e URL do vídeo são obrigatórios');
      return;
    }

    const videoId = (videos.length + 1).toString();
    
    const newVideoData = {
      id: videoId,
      title: newVideo.title.trim(),
      description: newVideo.description.trim(),
      duration: newVideo.duration || '0:00',
      completed: false,
      locked: false,
      embedUrl: newVideo.embedUrl.trim(),
      thumbnail: newVideo.thumbnail || undefined
    };

    const updatedVideos = [...videos, newVideoData];
    setVideos(updatedVideos);
    
    // Reset form
    setNewVideo({
      title: '',
      description: '',
      duration: '',
      embedUrl: '',
      thumbnail: ''
    });
    setIsAddingVideo(false);
    
    alert('Vídeo adicionado com sucesso!');
  };

  const handleRemoveVideo = (videoIndex: number) => {
    const video = videos[videoIndex];
    if (!confirm(`Tem certeza que deseja remover o vídeo "${video.title}"?`)) {
      return;
    }
    
    const updatedVideos = videos.filter((_, index) => index !== videoIndex);
    setVideos(updatedVideos);
    alert('Vídeo removido com sucesso!');
  };

  const handleRemoveBonus = (bonusIndex: number) => {
    const bonus = bonuses[bonusIndex];
    if (!confirm(`Tem certeza que deseja remover o bônus "${bonus.title}"?`)) {
      return;
    }
    
    const updatedBonuses = bonuses.filter((_, index) => index !== bonusIndex);
    setBonuses(updatedBonuses);
    alert('Bônus removido com sucesso!');
  };

  const saveVideoChanges = () => {
    saveOnboardingVideos(videos);
    window.dispatchEvent(new Event('onboardingDataUpdated'));
    alert('Vídeos atualizados com sucesso!');
  };

  const savePopupChanges = () => {
    savePopupContents(popups);
    window.dispatchEvent(new Event('popupDataUpdated'));
    alert('Pop-ups atualizados com sucesso!');
  };

  const saveBonusChanges = () => {
    localStorage.setItem('teacherpoli_bonus_data', JSON.stringify(bonuses));
    window.dispatchEvent(new Event('bonusDataUpdated'));
    alert('Bônus atualizados com sucesso!');
  };

  if (!isAdmin(userEmail)) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Painel Administrativo</h2>
              <p className="text-red-100 text-sm">Gerenciar conteúdo da plataforma</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-red-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'content', label: 'Conteúdo', icon: BookOpen },
              { id: 'students', label: 'Alunos', icon: Users },
              { id: 'popups', label: 'Pop-ups', icon: MessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total de Alunos</p>
                      <p className="text-2xl font-bold text-blue-900">{studentStats.total}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Ativos</p>
                      <p className="text-2xl font-bold text-green-900">{studentStats.active}</p>
                    </div>
                    <User className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 text-sm font-medium">Inativos</p>
                      <p className="text-2xl font-bold text-yellow-900">{studentStats.inactive}</p>
                    </div>
                    <EyeOff className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Este Mês</p>
                      <p className="text-2xl font-bold text-purple-900">{studentStats.addedThisMonth}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou email..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => setIsAddingStudent(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Aluno
                </button>
              </div>

              {/* Add Student Form */}
              {isAddingStudent && (
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Novo Aluno</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Nome do aluno"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={newStudent.notes}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Observações opcionais sobre o aluno..."
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAddStudent}
                      disabled={isLoading}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isLoading ? 'Adicionando...' : 'Adicionar Aluno'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsAddingStudent(false);
                        setNewStudent({ name: '', email: '', notes: '' });
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Students List */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Lista de Alunos ({students.length})
                  </h3>
                </div>
                
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Carregando alunos...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchQuery ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado ainda'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <div key={student.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">{student.name}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                student.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {student.status === 'active' ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4" />
                                <span>{student.email}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Adicionado em {new Date(student.added_at).toLocaleDateString('pt-BR')} por {student.added_by}
                                </span>
                              </div>
                              
                              {student.notes && (
                                <div className="mt-2">
                                  <p className="text-gray-700 bg-gray-100 p-2 rounded text-sm">
                                    {student.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveStudent(student.id, student.name)}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover aluno"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-8">
              {/* Onboarding Videos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Vídeos de Onboarding</h3>
                  <button
                    onClick={() => setIsAddingVideo(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Vídeo
                  </button>
                </div>
                
                {/* Add New Video Form */}
                {isAddingVideo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Novo Vídeo</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                        <input
                          type="text"
                          value={newVideo.title}
                          onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Título do vídeo"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duração</label>
                        <input
                          type="text"
                          value={newVideo.duration}
                          onChange={(e) => setNewVideo(prev => ({ ...prev, duration: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="ex: 2:30"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                      <textarea
                        value={newVideo.description}
                        onChange={(e) => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Descrição do vídeo"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL do Vídeo (YouTube Embed) *</label>
                      <input
                        type="url"
                        value={newVideo.embedUrl}
                        onChange={(e) => setNewVideo(prev => ({ ...prev, embedUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://www.youtube.com/embed/VIDEO_ID"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail/Capa do Vídeo</label>
                      <input
                        type="url"
                        value={newVideo.thumbnail}
                        onChange={(e) => setNewVideo(prev => ({ ...prev, thumbnail: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://exemplo.com/thumbnail.jpg"
                      />
                      {newVideo.thumbnail && (
                        <div className="mt-2">
                          <img 
                            src={newVideo.thumbnail} 
                            alt="Preview da thumbnail" 
                            className="w-32 h-20 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={handleAddVideo}
                        disabled={!newVideo.title || !newVideo.embedUrl}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Vídeo
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsAddingVideo(false);
                          setNewVideo({
                            title: '',
                            description: '',
                            duration: '',
                            embedUrl: '',
                            thumbnail: ''
                          });
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {videos.map((video, index) => (
                    <div key={video.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-semibold text-gray-900">Vídeo {index + 1}</h4>
                        <button
                          onClick={() => handleRemoveVideo(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover vídeo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                          <input
                            type="text"
                            value={video.title}
                            onChange={(e) => {
                              const newVideos = [...videos];
                              newVideos[index].title = e.target.value;
                              setVideos(newVideos);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Duração</label>
                          <input
                            type="text"
                            value={video.duration}
                            onChange={(e) => {
                              const newVideos = [...videos];
                              newVideos[index].duration = e.target.value;
                              setVideos(newVideos);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <textarea
                          value={video.description}
                          onChange={(e) => {
                            const newVideos = [...videos];
                            newVideos[index].description = e.target.value;
                            setVideos(newVideos);
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">URL do Vídeo (YouTube Embed)</label>
                        <input
                          type="url"
                          value={video.embedUrl}
                          onChange={(e) => {
                            const newVideos = [...videos];
                            newVideos[index].embedUrl = e.target.value;
                            setVideos(newVideos);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          placeholder="https://www.youtube.com/embed/VIDEO_ID"
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail/Capa do Vídeo</label>
                        <input
                          type="url"
                          value={video.thumbnail || ''}
                          onChange={(e) => {
                            const newVideos = [...videos];
                            newVideos[index].thumbnail = e.target.value;
                            setVideos(newVideos);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          placeholder="https://exemplo.com/thumbnail.jpg"
                        />
                        {video.thumbnail && (
                          <div className="mt-2">
                            <img 
                              src={video.thumbnail} 
                              alt="Preview da thumbnail" 
                              className="w-32 h-20 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveVideoChanges}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Salvar Alterações nos Vídeos
                </button>
              </div>

              {/* Bonus Resources */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recursos Bônus</h3>
                  <button
                    onClick={handleAddNewBonus}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Novo Bônus
                  </button>
                </div>
                
                {/* Add New Bonus Form */}
                {isAddingBonus && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Criar Novo Bônus</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                        <input
                          type="text"
                          value={newBonus.title}
                          onChange={(e) => setNewBonus(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Nome do bônus"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                        <select
                          value={newBonus.type}
                          onChange={(e) => setNewBonus(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="course">Curso</option>
                          <option value="ebook">E-book</option>
                          <option value="guide">Guia</option>
                          <option value="audio">Áudio</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                      <textarea
                        value={newBonus.description}
                        onChange={(e) => setNewBonus(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Descrição do bônus"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total de Aulas</label>
                        <input
                          type="number"
                          value={newBonus.totalLessons}
                          onChange={(e) => setNewBonus(prev => ({ ...prev, totalLessons: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duração Total</label>
                        <input
                          type="text"
                          value={newBonus.totalDuration}
                          onChange={(e) => setNewBonus(prev => ({ ...prev, totalDuration: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="ex: 2h 30min"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Avaliação</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={newBonus.rating}
                          onChange={(e) => setNewBonus(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL da Thumbnail</label>
                      <input
                        type="url"
                        value={newBonus.thumbnail}
                        onChange={(e) => setNewBonus(prev => ({ ...prev, thumbnail: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                      {newBonus.thumbnail && (
                        <div className="mt-2">
                          <img 
                            src={newBonus.thumbnail} 
                            alt="Preview" 
                            className="w-32 h-20 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCreateBonus}
                        disabled={!newBonus.title || !newBonus.description}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Bônus
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsAddingBonus(false);
                          setNewBonus({
                            title: '',
                            description: '',
                            type: 'course',
                            thumbnail: '',
                            totalLessons: 0,
                            totalDuration: '',
                            rating: 4.5
                          });
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bonuses.map((bonus, index) => (
                    <div key={bonus.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                        <input
                          type="text"
                          value={bonus.title}
                          onChange={(e) => {
                            const newBonuses = [...bonuses];
                            newBonuses[index].title = e.target.value;
                            setBonuses(newBonuses);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <textarea
                          value={bonus.description}
                          onChange={(e) => {
                            const newBonuses = [...bonuses];
                            newBonuses[index].description = e.target.value;
                            setBonuses(newBonuses);
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail/Capa</label>
                        <input
                          type="url"
                          value={bonus.thumbnail}
                          onChange={(e) => {
                            const newBonuses = [...bonuses];
                            newBonuses[index].thumbnail = e.target.value;
                            setBonuses(newBonuses);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          placeholder="https://exemplo.com/imagem.jpg"
                        />
                        {bonus.thumbnail && (
                          <div className="mt-2">
                            <img 
                              src={bonus.thumbnail} 
                              alt="Preview da capa" 
                              className="w-32 h-20 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Aulas</label>
                          <input
                            type="number"
                            value={bonus.totalLessons}
                            onChange={(e) => {
                              const newBonuses = [...bonuses];
                              newBonuses[index].totalLessons = parseInt(e.target.value) || 0;
                              setBonuses(newBonuses);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Duração</label>
                          <input
                            type="text"
                            value={bonus.totalDuration}
                            onChange={(e) => {
                              const newBonuses = [...bonuses];
                              newBonuses[index].totalDuration = e.target.value;
                              setBonuses(newBonuses);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleRemoveBonus(index)}
                          className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover bônus"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveBonusChanges}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Salvar Alterações nos Bônus
                </button>
              </div>
            </div>
          )}

          {/* Popups Tab */}
          {activeTab === 'popups' && (
            <div className="space-y-8">
              {popups.map((popup, index) => (
                <div key={popup.id} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {popup.type === 'welcome' ? 'Modal de Boas-vindas' : 'Modal de Plano Necessário'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                      <input
                        type="text"
                        value={popup.title}
                        onChange={(e) => {
                          const newPopups = [...popups];
                          newPopups[index].title = e.target.value;
                          setPopups(newPopups);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
                      <input
                        type="text"
                        value={popup.subtitle}
                        onChange={(e) => {
                          const newPopups = [...popups];
                          newPopups[index].subtitle = e.target.value;
                          setPopups(newPopups);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea
                      value={popup.description}
                      onChange={(e) => {
                        const newPopups = [...popups];
                        newPopups[index].description = e.target.value;
                        setPopups(newPopups);
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Botão</label>
                    <input
                      type="text"
                      value={popup.buttonText}
                      onChange={(e) => {
                        const newPopups = [...popups];
                        newPopups[index].buttonText = e.target.value;
                        setPopups(newPopups);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recursos/Benefícios (um por linha)
                    </label>
                    <textarea
                      value={popup.features.join('\n')}
                      onChange={(e) => {
                        const newPopups = [...popups];
                        newPopups[index].features = e.target.value.split('\n').filter(f => f.trim());
                        setPopups(newPopups);
                      }}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Digite cada recurso em uma linha separada"
                    />
                  </div>
                </div>
              ))}
              
              <button
                onClick={savePopupChanges}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Salvar Alterações nos Pop-ups
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}