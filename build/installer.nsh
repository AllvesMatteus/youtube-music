!macro customInstall
  ; Cria desktop.ini para definir o icone da pasta de instalacao
  WriteINIStr "$INSTDIR\desktop.ini" ".ShellClassInfo" "IconFile" "$INSTDIR\resources\assets\folder.ico"
  WriteINIStr "$INSTDIR\desktop.ini" ".ShellClassInfo" "IconIndex" "0"
  WriteINIStr "$INSTDIR\desktop.ini" ".ShellClassInfo" "InfoTip" "YouTube Music Desktop"
  
  ; Aplica atributos necessarios para o Windows ler o desktop.ini
  SetFileAttributes "$INSTDIR\desktop.ini" HIDDEN|SYSTEM
  SetFileAttributes "$INSTDIR" READONLY
  
  ; Forca o Windows Explorer a atualizar o cache de icones da pasta
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro customUnInstall
  ; Remove o desktop.ini e restaura atributos ao desinstalar
  SetFileAttributes "$INSTDIR\desktop.ini" NORMAL
  Delete "$INSTDIR\desktop.ini"
  SetFileAttributes "$INSTDIR" NORMAL
!macroend
