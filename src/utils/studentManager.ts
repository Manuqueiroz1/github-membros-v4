// Gerenciador de alunos para administradores
export interface Student {
  id: string;
  name: string;
  email: string;
  notes?: string;
  addedBy: string;
  addedAt: Date;
  status: 'active' | 'inactive';
}

// Chave para armazenar alunos no localStorage (temporário)
const STUDENTS_STORAGE_KEY = 'teacherpoli_manual_students';

// 🔧 FUNÇÃO PARA ADICIONAR ALUNO MANUALMENTE
export const addStudent = async (studentData: Omit<Student, 'id' | 'status'>): Promise<Student> => {
  try {
    const student: Student = {
      id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...studentData,
      status: 'active'
    };

    // 🔧 IMPLEMENTAÇÃO TEMPORÁRIA - LOCALSTORAGE
    // Em produção, substituir por chamada à API do backend
    const existingStudents = getStoredStudents();
    const updatedStudents = [...existingStudents, student];
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));

    // 🔧 IMPLEMENTAÇÃO REAL - BACKEND API
    /*
    const response = await fetch('/api/admin/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(studentData)
    });

    if (!response.ok) {
      throw new Error('Falha ao adicionar aluno');
    }

    const student = await response.json();
    */

    // 🔧 ENVIAR EMAIL DE BOAS-VINDAS (IMPLEMENTAR)
    await sendWelcomeEmail(student);

    return student;
  } catch (error) {
    console.error('Erro ao adicionar aluno:', error);
    throw error;
  }
};

// 🔧 FUNÇÃO PARA BUSCAR TODOS OS ALUNOS
export const getStudents = async (): Promise<Student[]> => {
  try {
    // 🔧 IMPLEMENTAÇÃO TEMPORÁRIA - LOCALSTORAGE
    return getStoredStudents();

    // 🔧 IMPLEMENTAÇÃO REAL - BACKEND API
    /*
    const response = await fetch('/api/admin/students', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar alunos');
    }

    return await response.json();
    */
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return [];
  }
};

// 🔧 FUNÇÃO PARA REMOVER ALUNO
export const removeStudent = async (studentId: string): Promise<void> => {
  try {
    // 🔧 IMPLEMENTAÇÃO TEMPORÁRIA - LOCALSTORAGE
    const existingStudents = getStoredStudents();
    const updatedStudents = existingStudents.filter(student => student.id !== studentId);
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));

    // 🔧 IMPLEMENTAÇÃO REAL - BACKEND API
    /*
    const response = await fetch(`/api/admin/students/${studentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao remover aluno');
    }
    */
  } catch (error) {
    console.error('Erro ao remover aluno:', error);
    throw error;
  }
};

// 🔧 FUNÇÃO PARA VERIFICAR SE EMAIL EXISTE (MANUAL + HOTMART)
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Verificar em alunos manuais
    const manualStudents = getStoredStudents();
    const existsInManual = manualStudents.some(
      student => student.email.toLowerCase() === email.toLowerCase()
    );

    if (existsInManual) {
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

// 🔧 FUNÇÃO AUXILIAR PARA LOCALSTORAGE
const getStoredStudents = (): Student[] => {
  try {
    const stored = localStorage.getItem(STUDENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao ler alunos do localStorage:', error);
    return [];
  }
};

// 🔧 FUNÇÃO PARA ENVIAR EMAIL DE BOAS-VINDAS
const sendWelcomeEmail = async (student: Student): Promise<void> => {
  try {
    // 🔧 IMPLEMENTAÇÃO REAL - SERVIÇO DE EMAIL
    /*
    const response = await fetch('/api/emails/welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        to: student.email,
        name: student.name,
        type: 'manual_addition'
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao enviar email de boas-vindas');
    }
    */

    console.log(`Email de boas-vindas enviado para: ${student.email}`);
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    // Não falhar a operação se o email não for enviado
  }
};

// 🔧 FUNÇÃO PARA OBTER TOKEN DE AUTENTICAÇÃO
const getAuthToken = (): string => {
  // Implementar lógica para obter token de autenticação do admin
  return localStorage.getItem('admin_token') || '';
};

// 🔧 FUNÇÃO PARA SINCRONIZAR COM SISTEMA DE AUTENTICAÇÃO
export const syncStudentWithAuth = async (student: Student): Promise<void> => {
  try {
    // Criar entrada no sistema de autenticação
    const response = await fetch('/api/auth/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        email: student.email,
        name: student.name,
        source: 'manual_addition',
        requirePasswordCreation: true
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao sincronizar com sistema de autenticação');
    }
  } catch (error) {
    console.error('Erro ao sincronizar com sistema de autenticação:', error);
    throw error;
  }
};

/*
🔧 ENDPOINTS NECESSÁRIOS NO BACKEND:

1. POST /api/admin/students
   - Adicionar aluno manualmente
   - Validar permissões de admin
   - Verificar se email já existe
   - Criar entrada no sistema de auth

2. GET /api/admin/students
   - Listar todos os alunos (manual + Hotmart)
   - Paginação e filtros
   - Apenas para admins

3. DELETE /api/admin/students/:id
   - Remover aluno manual
   - Desativar acesso
   - Apenas para admins

4. POST /api/emails/welcome
   - Enviar email de boas-vindas
   - Template específico para adição manual
   - Incluir link para criação de senha

5. POST /api/auth/create-user
   - Criar usuário no sistema de auth
   - Marcar como "requer criação de senha"
   - Integrar com sistema existente

🔧 ESTRUTURA DO BANCO DE DADOS:

Tabela: manual_students
- id (UUID, primary key)
- name (VARCHAR, not null)
- email (VARCHAR, unique, not null)
- notes (TEXT, nullable)
- added_by (VARCHAR, not null)
- added_at (TIMESTAMP, not null)
- status (ENUM: active, inactive)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Índices:
- email (único)
- added_by
- status
- added_at
*/