!macro customInstall
  ; Garante a presenca de folder.ico na raiz da pasta instalada
  File "/oname=$INSTDIR\folder.ico" "${BUILD_RESOURCES_DIR}\..\assets\folder.ico"
  
  ; Remove qualquer desktop.ini existente para limpar atributos e cache antigos
  SetFileAttributes "$INSTDIR\desktop.ini" NORMAL
  Delete "$INSTDIR\desktop.ini"
  
  ; Cria o desktop.ini padrao do Windows Explorer
  WriteINIStr "$INSTDIR\desktop.ini" ".ShellClassInfo" "IconResource" "folder.ico,0"
  WriteINIStr "$INSTDIR\desktop.ini" ".ShellClassInfo" "IconFile" "folder.ico"
  WriteINIStr "$INSTDIR\desktop.ini" ".ShellClassInfo" "IconIndex" "0"
  WriteINIStr "$INSTDIR\desktop.ini" ".ShellClassInfo" "InfoTip" "YouTube Music Desktop"
  WriteINIStr "$INSTDIR\desktop.ini" "ViewState" "FolderType" "Generic"
  
  ; Aplica atributos necessarios no arquivo de icone e no desktop.ini
  SetFileAttributes "$INSTDIR\folder.ico" HIDDEN|SYSTEM
  SetFileAttributes "$INSTDIR\desktop.ini" HIDDEN|SYSTEM
  
  ; O atributo READONLY na pasta raiz e obrigatorio para o Windows processar o desktop.ini
  SetFileAttributes "$INSTDIR" READONLY
  
  ; Notifica o Windows Explorer para invalidar o cache de icones da pasta instalada
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
  System::Call 'shell32::SHChangeNotify(i 0x00001000, i 0x0005, w "$INSTDIR", i 0)'
!macroend

!macro customUnInstall
  ; Remove desktop.ini e folder.ico e restaura atributos normais
  SetFileAttributes "$INSTDIR\desktop.ini" NORMAL
  Delete "$INSTDIR\desktop.ini"
  SetFileAttributes "$INSTDIR\folder.ico" NORMAL
  Delete "$INSTDIR\folder.ico"
  SetFileAttributes "$INSTDIR" NORMAL
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
