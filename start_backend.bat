@echo off
echo Inicializando o servidor backend do Meu Acervo...
cd backend
echo Instalando dependencias...
npm install

echo.
echo Iniciando o servidor na porta 3001...
echo.
echo Para parar o servidor, pressione Ctrl+C.
echo.
npm run dev
