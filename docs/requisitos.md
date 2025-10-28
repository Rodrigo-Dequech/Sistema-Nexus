# Sistema de Cotação de Serviços de Home Care

## 1. Objetivo
Desenvolver um sistema web para gestão de cotações de serviços de atendimento hospitalar domiciliar (home care), permitindo o cadastro de fornecedores, serviços e a realização de cotações com acompanhamento de status.

## 2. Perfis de Usuário
- **Administrador(a)**: responsável por cadastrar fornecedores, serviços e gerenciar cotações.
- **Futuro possível perfil**: Gestor ou Auditor para acompanhamento e validação de cotações.

## 3. Requisitos Funcionais
### 3.1 Autenticação e Acesso
1. **RF001** – O sistema deve possuir uma tela de login com campos de usuário e senha.
2. **RF002** – O sistema deve validar as credenciais e direcionar o usuário autenticado para o painel inicial.
3. **RF003** – Deve haver controle de sessão e opção para logout.

### 3.2 Cadastro de Fornecedores
4. **RF004** – O usuário deve poder acessar o menu “Fornecedores” através da tela inicial.
5. **RF005** – O sistema deve permitir cadastrar fornecedores/prestadores com os seguintes campos:
   - Nome/Razão Social
   - CPF ou CNPJ
   - Endereço
   - Telefone de contato
   - E-mail
6. **RF006** – O sistema deve listar os fornecedores cadastrados, permitindo editar ou excluir registros.
7. **RF007** – Deve existir validação para evitar cadastros duplicados com o mesmo CPF/CNPJ.

### 3.3 Cadastro de Serviços e Tipos de Serviço
8. **RF008** – O sistema deve possuir um menu “Serviços” para cadastro de serviços.
9. **RF009** – Cada serviço deve conter o nome do serviço (ex: Atendimento Médico, Fisioterapeuta etc.).
10. **RF010** – O sistema deve permitir cadastrar tipos de serviço vinculados a um serviço principal com os campos nome do tipo de serviço e valor médio.
11. **RF011** – O sistema deve listar os serviços e seus respectivos tipos de serviço, com opções de edição e exclusão.

### 3.4 Cotação
12. **RF012** – O sistema deve ter uma opção “Cotações” no menu principal.
13. **RF013** – A tela de cotações deve listar todas as cotações com as seguintes informações:
    - Número da cotação (gerado automaticamente)
    - Data de criação
    - Status (Em cotação, Em análise, Negada, Autorizado)
    - Fornecedores participantes
14. **RF014** – Deve existir um botão “Nova Cotação”.
15. **RF015** – Ao clicar em “Nova Cotação”, deve abrir uma modal de seleção de prestadores, contendo:
    - Campo dropdown com busca dinâmica dos fornecedores cadastrados.
    - Lista dos prestadores selecionados na parte inferior da modal.
    - O prestador selecionado sai da lista disponível para evitar duplicidade.
16. **RF016** – Deve existir um botão “Ir para cotação”, que abre a tela de definição dos serviços.
17. **RF017** – Na tela de cotação, o usuário deve poder selecionar os tipos de serviço que deseja cotar.
18. **RF018** – O sistema deve permitir salvar e enviar a cotação para os prestadores selecionados.
19. **RF019** – Cada cotação deve poder ter o status atualizado manualmente (Em análise, Negada, Autorizado).
20. **RF020** – O sistema deve registrar data e hora das alterações de status e usuário responsável.

## 4. Requisitos Não Funcionais
1. **RNF001** – O sistema deve ser web responsivo, acessível via desktop e dispositivos móveis.
2. **RNF002** – O sistema deve armazenar dados em banco de dados relacional (ex: MySQL, PostgreSQL).
3. **RNF003** – Todas as ações de criação, edição e exclusão devem ser registradas em log.
4. **RNF004** – O sistema deve ter interface intuitiva e organizada, com design limpo e objetivo.
5. **RNF005** – O backend deve ser desenvolvido com API RESTful, permitindo integração futura.
6. **RNF006** – O sistema deve possuir camadas de segurança, como criptografia de senha e controle de acesso.
7. **RNF007** – O tempo máximo de resposta para ações de CRUD deve ser inferior a 2 segundos em ambiente normal.

## 5. Requisitos Futuros (Evolutivos)
1. **RF021** – Envio automático de e-mail aos fornecedores quando participarem de uma cotação.
2. **RF022** – Exportação de relatórios de cotações em PDF e Excel.
3. **RF023** – Integração com sistema financeiro para controle de pagamentos.
4. **RF024** – Módulo de avaliação de desempenho de fornecedores.

## 6. Regras de Negócio
1. **RN001** – Um fornecedor não pode ser adicionado mais de uma vez na mesma cotação.
2. **RN002** – A exclusão de um fornecedor ou serviço deve ser bloqueada se houver cotações associadas.
3. **RN003** – Somente usuários com perfil de administrador podem criar ou alterar cadastros.
4. **RN004** – Cada cotação deve possuir pelo menos um fornecedor e um tipo de serviço.
