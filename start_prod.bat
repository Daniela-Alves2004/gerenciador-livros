@echo off
REM Script para iniciar o ambiente de produção otimizado
echo === Iniciando ambiente de produção otimizado ===
echo.

REM Verifica se a pasta de build do frontend existe
IF NOT EXIST "%~dp0frontend\build" (
  echo Pasta de build do frontend não encontrada! Criando build...
  cd "%~dp0frontend"
  call npm run build
  cd "%~dp0"
  echo.
) else (
  echo Build do frontend encontrado.
)

REM Inicia o servidor backend que também servirá os arquivos estáticos do frontend
echo Iniciando servidor backend (modo produção)...
cd "%~dp0backend"

REM Copia o arquivo de ambiente de produção
IF EXIST "%~dp0backend\.env.production" (
  echo Usando configurações de ambiente de produção
  copy /Y "%~dp0backend\.env.production" "%~dp0backend\.env"
) ELSE (
  echo Arquivo .env.production não encontrado, criando variáveis de ambiente básicas
  REM Define variáveis de ambiente para produção
  set NODE_ENV=production
  set PORT=3001
  set LOG_LEVEL=info
)

REM Executa o servidor
node src/server.js

echo.
echo === Ambiente encerrado ===
