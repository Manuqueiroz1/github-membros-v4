// Importações condicionais para evitar erros quando Supabase não está configurado
let supabase: any = null;
let ManualStudent: any = null;
let CreateStudentData: any = null;

try {
  const supabaseModule = await import('../lib/supabase');
  supabase = supabaseModule.supabase;
  ManualStudent = supabaseModule.ManualStudent;
  CreateStudentData = supabaseModule.CreateStudentData;
} catch (error) {
  console.warn('Supabase não configurado, usando modo offline');
}

// Tipos locais para quando Supabase não está disponível
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

// 🔧 FUNÇÃO PARA ADICIONAR ALUNO MANUALMENTE
export const addStudent = async (studentData: CreateStudentData): Promise<ManualStudent> => {
  try {
    // Verificar se email já existe
    const { data: existingStudent } = await supabase
      .from('manual_students')
      .select('email')
      .eq('email', studentData.email.toLowerCase())
      .single();

    if (existingStudent) {
      throw new Error('Este email já está cadastrado');
    }

    // Inserir novo aluno
    const { data, error } = await supabase
      .from('manual_students')
      .insert([{
        ...studentData,
        email: studentData.email.toLowerCase(),
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro do Supabase:', error);
      throw new Error('Erro ao adicionar aluno: ' + error.message);
    }

    if (!data) {
      throw new Error('Nenhum dado retornado após inserção');
    }

    // 🔧 ENVIAR EMAIL DE BOAS-VINDAS (OPCIONAL)
    try {
      await sendWelcomeEmail(data);
    } catch (emailError) {
      console.warn('Erro ao enviar email de boas-vindas:', emailError);
      // Não falhar a operação se o email não for enviado
    }

    return data;
  } catch (error) {
    console.error('Erro ao adicionar aluno:', error);
    throw error;
  }
};

// 🔧 FUNÇÃO PARA BUSCAR TODOS OS ALUNOS
export const getStudents = async (): Promise<ManualStudent[]> => {
  try {
    const { data, error } = await supabase
      .from('manual_students')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Erro do Supabase:', error);
      throw new Error('Erro ao buscar alunos: ' + error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return [];
  }
};

// 🔧 FUNÇÃO PARA REMOVER ALUNO
export const removeStudent = async (studentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('manual_students')
      .delete()
      .eq('id', studentId);

    if (error) {
      console.error('Erro do Supabase:', error);
      throw new Error('Erro ao remover aluno: ' + error.message);
    }
  } catch (error) {
    console.error('Erro ao remover aluno:', error);
    throw error;
  }
};

// 🔧 FUNÇÃO PARA ATUALIZAR STATUS DO ALUNO
export const updateStudentStatus = async (studentId: string, status: 'active' | 'inactive'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('manual_students')
      .update({ status })
      .eq('id', studentId);

    if (error) {
      console.error('Erro do Supabase:', error);
      throw new Error('Erro ao atualizar status: ' + error.message);
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

// 🔧 FUNÇÃO PARA VERIFICAR SE EMAIL EXISTE (MANUAL + HOTMART)
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Verificar em alunos manuais no Supabase
    const { data: manualStudent } = await supabase
      .from('manual_students')
      .select('email')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .single();

    if (manualStudent) {
      return true;
    }

    // Verificar na Hotmart (usar função existente)
    const { verifyHotmartPurchase } = await import('./hotmartApi');
    return await verifyHotmartPurchase(email);

  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return false;
  }
};

// 🔧 FUNÇÃO PARA BUSCAR ALUNO POR EMAIL
export const getStudentByEmail = async (email: string): Promise<ManualStudent | null> => {
  try {
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
  } catch (error) {
    console.error('Erro ao buscar aluno por email:', error);
    return null;
  }
};

// 🔧 FUNÇÃO PARA ENVIAR EMAIL DE BOAS-VINDAS
const sendWelcomeEmail = async (student: ManualStudent): Promise<void> => {
  try {
    // 🔧 IMPLEMENTAÇÃO COM SUPABASE EDGE FUNCTIONS
    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        to: student.email,
        name: student.name,
        type: 'manual_addition',
        studentId: student.id
      }
    });

    if (error) {
      throw error;
    }

    console.log(`Email de boas-vindas enviado para: ${student.email}`);
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    // Não falhar a operação se o email não for enviado
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
    // Se Supabase não estiver configurado, usar localStorage
    if (!supabase) {
      const students = getStudentsLocal();
      return students.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase())
      );
    }

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
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return [];
  }
};