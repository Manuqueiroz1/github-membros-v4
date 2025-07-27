/*
  # Criar tabela de alunos manuais

  1. Nova Tabela
    - `manual_students`
      - `id` (uuid, primary key)
      - `name` (text, nome do aluno)
      - `email` (text, unique, email do aluno)
      - `notes` (text, observações opcionais)
      - `added_by` (text, email do admin que adicionou)
      - `added_at` (timestamptz, quando foi adicionado)
      - `status` (text, ativo/inativo)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Enable RLS na tabela `manual_students`
    - Política para admins lerem e modificarem dados
    - Política para usuários verificarem se existem

  3. Índices
    - Índice único no email
    - Índice no status para queries rápidas
*/

-- Criar tabela de alunos manuais
CREATE TABLE IF NOT EXISTS manual_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  notes text,
  added_by text NOT NULL,
  added_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE manual_students ENABLE ROW LEVEL SECURITY;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_manual_students_updated_at
  BEFORE UPDATE ON manual_students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_manual_students_email ON manual_students(email);
CREATE INDEX IF NOT EXISTS idx_manual_students_status ON manual_students(status);
CREATE INDEX IF NOT EXISTS idx_manual_students_added_by ON manual_students(added_by);
CREATE INDEX IF NOT EXISTS idx_manual_students_added_at ON manual_students(added_at);

-- Políticas RLS

-- Política para admins: podem fazer tudo
CREATE POLICY "Admins can manage all manual students"
  ON manual_students
  FOR ALL
  TO authenticated
  USING (
    added_by IN (
      'admin@teacherpoli.com',
      'suporte@teacherpoli.com', 
      'manu@teacherpoli.com',
      'poli@teacherpoli.com'
    )
  )
  WITH CHECK (
    added_by IN (
      'admin@teacherpoli.com',
      'suporte@teacherpoli.com',
      'manu@teacherpoli.com', 
      'poli@teacherpoli.com'
    )
  );

-- Política para verificação de email: qualquer usuário autenticado pode verificar se um email existe
CREATE POLICY "Anyone can check if email exists"
  ON manual_students
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Política para usuários verificarem seus próprios dados
CREATE POLICY "Users can view their own data"
  ON manual_students
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');