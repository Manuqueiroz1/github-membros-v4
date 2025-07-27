// Sistema de gerenciamento de alunos que funciona com ou sem Supabase
// Quando Supabase não está configurado, usa localStorage como fallback

// Tipos locais
interface LocalManualStudent {
  id: string;
  name: string;
  email: string;
  notes?: string;
  added_by: string;
  added_at: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface LocalCreateStudentData {
  name: string;
  email: string;
  notes?: string;
  added_by: string;
}

// Verificar se Supabase está disponível
let supabase: any = null;
let isSupabaseAvailable = false;

try {
  const supabaseModule = require('../lib/supabase');
  supabase = supabaseModule.supabase;
  isSupabaseAvailable = !!supabase;
} catch (error) {
  console.log('Supabase não configurado, usando localStorage');
  isSupabaseAvailable = false;
}

// Funções para localStorage (fallback)
const getStudentsLocal = (): LocalManualStudent[] => {
  try {
    const stored = localStorage.getItem('teacherpoli_manual_students');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao carregar alunos do localStorage:', error);
    return [];
  }
};

const saveStudentsLocal = (students: LocalManualStudent[]): void => {
  try {
    localStorage.setItem('teacherpoli_manual_students', JSON.stringify(students));
  } catch (error) {
    console.error('Erro ao salvar alunos no localStorage:', error);
  }
};

const generateId = (): string => {
  return 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// 🔧 FUNÇÃO PARA ADICIONAR ALUNO MANUALMENTE
export const addStudent = async (studentData: LocalCreateStudentData): Promise<LocalManualStudent> => {
  try {
    // Verificar se email já existe
    const existingStudent = await getStudentByEmail(studentData.email);
    if (existingStudent) {
      throw new Error('Este email já está cadastrado');
    }

    const newStudent: LocalManualStudent = {
      id: generateId(),
      name: studentData.name,
      email: studentData.email.toLowerCase(),
      notes: studentData.notes || '',
      added_by: studentData.added_by,
      added_at: new Date().toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseAvailable) {
      // Usar Supabase se disponível
      const { data, error } = await supabase
        .from('manual_students')
        .insert([newStudent])
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase:', error);
        throw new Error('Erro ao adicionar aluno: ' + error.message);
      }

      return data;
    } else {
      // Usar localStorage como fallback
      const students = getStudentsLocal();
      students.push(newStudent);
      saveStudentsLocal(students);
      
      console.log('Aluno adicionado no localStorage:', newStudent);
      return newStudent;
    }
  } catch (error) {
    console.error('Erro ao adicionar aluno:', error);
    throw error;
  }
};

// 🔧 FUNÇÃO PARA BUSCAR TODOS OS ALUNOS
export const getStudents = async (): Promise<LocalManualStudent[]> => {
  try {
    if (isSupabaseAvailable) {
      const { data, error } = await supabase
        .from('manual_students')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Erro do Supabase:', error);
        throw new Error('Erro ao buscar alunos: ' + error.message);
      }

      return data || [];
    } else {
      // Usar localStorage
      return getStudentsLocal().sort((a, b) => 
        new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      );
    }
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return getStudentsLocal();
  }
};

// 🔧 FUNÇÃO PARA REMOVER ALUNO
export const removeStudent = async (studentId: string): Promise<void> => {
  try {
    if (isSupabaseAvailable) {
      const { error } = await supabase
        .from('manual_students')
        .delete()
        .eq('id', studentId);

      if (error) {
        console.error('Erro do Supabase:', error);
        throw new Error('Erro ao remover aluno: ' + error.message);
      }
    } else {
      // Usar localStorage
      const students = getStudentsLocal();
      const filteredStudents = students.filter(s => s.id !== studentId);
      saveStudentsLocal(filteredStudents);
    }
  } catch (error) {
    console.error('Erro ao remover aluno:', error);
    throw error;
  }
};

// 🔧 FUNÇÃO PARA ATUALIZAR STATUS DO ALUNO
export const updateStudentStatus = async (studentId: string, status: 'active' | 'inactive'): Promise<void> => {
  try {
    if (isSupabaseAvailable) {
      const { error } = await supabase
        .from('manual_students')
        .update({ status })
        .eq('id', studentId);

      if (error) {
        console.error('Erro do Supabase:', error);
        throw new Error('Erro ao atualizar status: ' + error.message);
      }
    } else {
      // Usar localStorage
      const students = getStudentsLocal();
      const updatedStudents = students.map(s => 
        s.id === studentId 
          ? { ...s, status, updated_at: new Date().toISOString() }
          : s
      );
      saveStudentsLocal(updatedStudents);
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

// 🔧 FUNÇÃO PARA VERIFICAR SE EMAIL EXISTE (MANUAL + HOTMART)
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Verificar em alunos manuais
    const manualStudent = await getStudentByEmail(email);
    if (manualStudent) {
      return true;
    }

    // Verificar na Hotmart (usar função existente)
    try {
      const { verifyHotmartPurchase } = await import('./hotmartApi');
      return await verifyHotmartPurchase(email);
    } catch (error) {
      console.error('Erro ao verificar Hotmart:', error);
      return false;
    }
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return false;
  }
};

// 🔧 FUNÇÃO PARA BUSCAR ALUNO POR EMAIL
export const getStudentByEmail = async (email: string): Promise<LocalManualStudent | null> => {
  try {
    if (isSupabaseAvailable) {
      const { data, error } = await supabase
        .from('manual_students')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro do Supabase:', error);
        return null;
      }

      return data;
    } else {
      // Usar localStorage
      const students = getStudentsLocal();
      return students.find(s => 
        s.email.toLowerCase() === email.toLowerCase() && 
        s.status === 'active'
      ) || null;
    }
  } catch (error) {
    console.error('Erro ao buscar aluno por email:', error);
    return null;
  }
};

// 🔧 FUNÇÃO PARA BUSCAR ESTATÍSTICAS
export const getStudentStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  addedThisMonth: number;
}> => {
  try {
    if (isSupabaseAvailable) {
      // Total de alunos
      const { count: total } = await supabase
        .from('manual_students')
        .select('*', { count: 'exact', head: true });

      // Alunos ativos
      const { count: active } = await supabase
        .from('manual_students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Alunos inativos
      const { count: inactive } = await supabase
        .from('manual_students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inactive');

      // Alunos adicionados este mês
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: addedThisMonth } = await supabase
        .from('manual_students')
        .select('*', { count: 'exact', head: true })
        .gte('added_at', startOfMonth.toISOString());

      return {
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
        addedThisMonth: addedThisMonth || 0
      };
    } else {
      // Usar localStorage
      const students = getStudentsLocal();
      const active = students.filter(s => s.status === 'active').length;
      const inactive = students.filter(s => s.status === 'inactive').length;
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const addedThisMonth = students.filter(s => 
        new Date(s.added_at) >= startOfMonth
      ).length;

      return {
        total: students.length,
        active,
        inactive,
        addedThisMonth
      };
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      addedThisMonth: 0
    };
  }
};

// 🔧 FUNÇÃO PARA BUSCAR ALUNOS COM FILTROS
export const searchStudents = async (query: string): Promise<LocalManualStudent[]> => {
  try {
    if (isSupabaseAvailable) {
      const { data, error } = await supabase
        .from('manual_students')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Erro do Supabase:', error);
        throw new Error('Erro ao buscar alunos: ' + error.message);
      }

      return data || [];
    } else {
      // Usar localStorage
      const students = getStudentsLocal();
      return students.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase())
      ).sort((a, b) => 
        new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      );
    }
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return [];
  }
};

// Exportar tipos para uso em outros arquivos
export type { LocalManualStudent as ManualStudent, LocalCreateStudentData as CreateStudentData };