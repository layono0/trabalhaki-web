  ### 1. O que foi implementado
  
  • Back-end (trabalhaki-backend)
      • Fila de candidatos interessados na vaga (GET
      /api/v1/jobs/{id}/applicants): retorna exclusivamente candidatos que já
      curtiram a vaga em candidate_likes e que ainda não foram
      curtidos/descartados pela empresa nem viraram match, ordenados por
      compatibilityScore decrescente e enriquecidos com formação, contrato   
      preferido, explicação do algoritmo e appliedAt.                        
      • Descarte e desfazer descarte (POST e DELETE  
      /api/v1/likes/company/job/{jobId}/candidate/{candidateId}/pass):
      persistência via entidade CompanyPass e limpeza automática caso a      
      empresa decida curtir depois.                                          
      • Contadores e metadados aditivos: JobResponse passou a incluir    
      totalApplicantsCount e pendingApplicantsCount; MatchResponse passou a
      expor jobSnapshotJson, candidateSnapshotJson e processStatus;    
      ConversationResponse.ChatMessageResponse passou a expor senderRole.
      • Upload de logotipo da empresa (POST /api/v1/companies/me/logo):   
      reutiliza FileStorageService (JPEG/PNG/WEBP até 3 MB), restrito a     
      usuários COMPANY com papel ADMIN.
      • Dados de demonstração e perfil H2: DataInitializer agora mantém 2
      vagas REMOTE ativas para a conta empresa@trabalhaki.com e cria 4 
      candidatos extras já candidatados a essas vagas para uso imediato no 
      swipe web; adicionado perfil h2 em application-h2.properties.
  • Portal Web Empresarial (trabalhaki-web — React + TypeScript + Vite)
      • Landing Page (/): apresentação comercial do ecossistema Trabalhaki
      com demonstração interativa de swipe/match na própria página inicial,
      dados de mercado referenciados, fluxo Mobile ↔ Web, detalhamento dos   
      pesos de compatibilidade (0–100), comparativo de planos (FREE e      
      PREMIUM) e CTA Acessar Painel.
      • Autenticação exclusiva para empresas (/login e /cadastro): login JWT
      com renovação automática via /auth/refresh, bloqueio explícito de
      contas CANDIDATE, preenchimento rápido da conta de demonstração
      (empresa@trabalhaki.com / 123456), configuração opcional da URL da API
      e cadastro de nova empresa com máscara e validação estrutural de CNPJ.
      • Painel de Vagas (/painel/vagas): resumo operacional (limite de 3 
      vagas ativas no plano FREE, candidatos pendentes e matches), filtros 
      por status, busca, criação/edição em drawer lateral (JobFormDrawer), 
      pausar/reativar e encerrar vagas, além de atalho direto para avaliar os
      interessados de cada vaga.
      • Swipe de Candidatos Interessados (/painel/swipe e
      /painel/swipe/:jobId): seletor da vaga no topo, pilha de cartões com   
      arraste por mouse/toque, carimbos INTERESSADO / PASSAR, atalhos de    
      teclado (←, →, Ctrl+Z), botão de desfazer o último descarte, drawer com
      perfil completo + explicação dos 5 critérios e modal comemorativo de 
      Match confirmado ao curtir.
      • Chat Pós-Match e Processo Seletivo (/painel/chat e         
      /painel/chat/:matchId): layout em duas colunas com busca, filtro por
      vaga, polling a cada 4 segundos, sugestões de primeira mensagem da     
      empresa, preservação de rascunho por conversa e drawer Processo       
      Seletivo & Snapshot exibindo os snapshots congelados da vaga e do 
      candidato no match + avanço auditável de etapas (IN_REVIEW, INTERVIEW,
      APPROVED, REJECTED).
      • Perfil da Empresa e Equipe (/painel/empresa): edição dos dados
      institucionais, upload de logotipo, status do CNPJ/plano e gestão de
      recrutadores vinculados (ADMIN e RECRUITER). 
  
  ──────
  ### 2. Arquivos criados e alterados
  
  • Back-end (trabalhaki-backend)   
      • Criados:              
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/domain/model/Co
      mpanyPass.java,                                                        
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/repository/Comp
      anyPassRepository.java,                                                
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/dto/job/JobAppl
      icantResponse.java,                                                    
      trabalhaki-backend/src/main/resources/application-h2.properties,       
      trabalhaki-backend/src/test/java/com/trabalhaki/backend/EmployerPortalI
      ntegrationTest.java                                                    
      • Alterados: trabalhaki-backend/schema.sql,                            
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/config/DataInit
      ializer.java,                                                          
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/controller/JobC
      ontroller.java,                                                        
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/controller/Like
      Controller.java,                                                       
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/controller/Comp
      anyController.java,                                                    
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/dto/job/JobResp
      onse.java,                                                             
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/dto/match/Match
      Response.java,                                                         
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/dto/chat/Conver
      sationResponse.java,                                                   
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/service/Recomme
      ndationService.java,                                                   
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/service/LikeSer
      vice.java,                                                             
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/service/JobServ
      ice.java,                                                              
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/service/MatchSe
      rvice.java,                                                            
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/service/ChatSer
      vice.java,                                                             
      trabalhaki-backend/src/main/java/com/trabalhaki/backend/service/Company
      Service.java                                                           
  • Portal Web (trabalhaki-web)
      • Configuração e base: trabalhaki-web/package.json,                    
      trabalhaki-web/tsconfig.json, trabalhaki-web/tsconfig.app.json,        
      trabalhaki-web/tsconfig.node.json, trabalhaki-web/vite.config.ts,      
      trabalhaki-web/index.html, trabalhaki-web/.gitignore,                  
      trabalhaki-web/src/index.css, trabalhaki-web/src/main.tsx,             
      trabalhaki-web/src/App.tsx, trabalhaki-web/src/vite-env.d.ts           
      • Tipos, API, contexto e utilitários: trabalhaki-web/src/types/api.ts, 
      trabalhaki-web/src/services/api.ts,                                    
      trabalhaki-web/src/context/AuthContext.tsx,                            
      trabalhaki-web/src/utils/cnpj.ts,                                      
      trabalhaki-web/src/utils/formatters.ts                                 
      • Páginas e componentes: trabalhaki-web/src/pages/LandingPage.tsx,     
      trabalhaki-web/src/pages/AuthPage.tsx,                                 
      trabalhaki-web/src/components/DashboardLayout.tsx,                     
      trabalhaki-web/src/pages/JobsPage.tsx,                                 
      trabalhaki-web/src/components/JobFormDrawer.tsx,                       
      trabalhaki-web/src/pages/CandidateSwipePage.tsx,                       
      trabalhaki-web/src/components/CandidateSwipeCard.tsx,                  
      trabalhaki-web/src/components/CandidateDetailDrawer.tsx,               
      trabalhaki-web/src/components/MatchCelebrationModal.tsx,               
      trabalhaki-web/src/pages/ChatPage.tsx,                                 
      trabalhaki-web/src/pages/CompanyProfilePage.tsx                        
      • Testes: trabalhaki-web/src/test/setup.ts,                            
      trabalhaki-web/src/test/portal.test.tsx                                
                                                                             
  ──────                                                                     
  ### 3. Testes executados e resultados                                      
                                                                             
  • Suíte JUnit/Spring Boot (trabalhaki-backend):                            
  JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./mvnw -o test — 23 testes    
  executados, 0 falhas, 0 erros, 0 ignorados (AuthControllerTest,            
  BackendApplicationTests, EmployerPortalIntegrationTest,                    
  JobAndMatchBusinessRulesTest e FileUploadTest).                            
  • Suíte Vitest (trabalhaki-web): npm test -- --run — 7 de 7 testes         
  aprovados em trabalhaki-web/src/test/portal.test.tsx (cobrindo landing page,
  bloqueio de candidato e login empresarial, validação de CNPJ, swipe com    
  pass/undo/match, chat pós-match, criação de vaga e gestão de membros com   
  fetch mockado).                                                            
  • Verificação de tipos e build de produção (trabalhaki-web): npm run build 
  (tsc -b && vite build) — concluído sem erros (dist/index.html, CSS e bundle
  JS gerados).                                                               
  • Smoke test HTTP ponta a ponta (BackendApplication com perfil h2):        
  servidor iniciado temporariamente na porta 18080 validou em sequência real 
  os endpoints POST /api/v1/auth/login (200), GET /api/v1/jobs/my (200, 2    
  vagas com contadores pendentes 3 e 2), GET /api/v1/jobs/1/applicants (200),
  POST /api/v1/likes/company/job/1/candidate/2 (200, isMatch: true), POST    
  /api/v1/matches/1/chat/messages (201, senderRole: COMPANY), PATCH          
  /api/v1/matches/1/process/advance (200, INTERVIEW) e GET                   
  /api/v1/companies/me (200).                                                
  ──────                                                                     
  ### 4. Limitações e observações restantes                                  
                                                                             
  • Banco de dados padrão:                                                   
  trabalhaki-backend/src/main/resources/application.properties aponta para   
  MariaDB local (localhost:3306/trabalhaki). Caso execute contra um banco    
  MariaDB já populado antes desta atualização, garanta a criação da tabela   
  company_passes (ou deixe spring.jpa.hibernate.ddl-auto=update criar) e     
  observe que o DataInitializer só cria novos candidatos se os e-mails demo  
  ainda não existirem. Para rodar sem MariaDB instalado, utilize --spring.   
  profiles.active=h2.                                                        
  • Comunicação do chat e planos: o chat opera por polling a cada 4 segundos 
  (sem WebSocket), conforme a arquitetura existente do back-end; os planos   
  FREE/PREMIUM exibem o limite de 3 vagas ativas no gratuito sem gateway de  
  pagamento integrado.                                                       
  • Validação visual em navegador real: a renderização e fluxos web foram    
  validados por tsc, vite build, Vitest/jsdom e smoke test HTTP contra o     
  back-end; não foi aberto navegador gráfico para inspeção visual manual. O  
  app Flutter (trabalhaki-frontend) não foi modificado e sua suíte Flutter   
  não foi reexecutada.                                                       
  ──────                                                                     
  ### 5. Como validar manualmente                                            
                                                                             
  1. Subir o back-end (em trabalhaki-backend):                               
      • Com MariaDB local rodando (ou usando o perfil H2 em memória):        
                                                                             
    cd /home/layono/Documentos/Trbalhaki/trabalhaki-backend                  
    ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2                     
  (Se o Maven local estiver em modo offline e o plugin spring-boot:run não   
  estiver em cache, execute uma vez sem -o ou use ./mvnw package -DskipTests 
  / sua IDE).
  2. Subir o portal web (em trabalhaki-web):
    cd /home/layono/Documentos/Trbalhaki/trabalhaki-web
    npm run dev
  
  3. Testar os fluxos no navegador (http://localhost:5173):
      • Explore a Landing Page em / (teste os botões de swipe na prévia do   
      Hero) e clique em Acessar Painel.
      • Em /login, confirme que uma conta de candidato (candidato@trabalhaki.
      com / 123456) é bloqueada, depois clique na conta demo empresarial     
      (empresa@trabalhaki.com / 123456) e entre.
      • No Painel de Vagas, crie/edite uma vaga e clique em Avaliar para     
      abrir o Swipe de Candidatos daquela vaga.
      • Teste Passar, Desfazer e Tenho interesse para confirmar o modal de   
      Match, clique em Iniciar conversa agora, envie a primeira mensagem no  
      Chat Pós-Match, abra Snapshot & Etapas para avançar a etapa seletiva e 
      revise Perfil da Empresa para atualizar dados, enviar logo e adicionar 
      membros.
  

