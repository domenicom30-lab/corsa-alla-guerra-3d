# Attivazione agente Codex orario

Il workflow `.github/workflows/codex-issue-agent.yml` controlla ogni ora le issue aperte create dal proprietario del repository, una alla volta. Codex propone modifiche in una **draft pull request**. Non esegue merge automatici.

## Prima attivazione
1. Apri `Settings > Secrets and variables > Actions > New repository secret`.
2. Nome: `OPENAI_API_KEY`. Valore: una chiave API creata in https://platform.openai.com/api-keys . Non inserirla nel codice, nelle issue o nella chat.
3. L'API è fatturata separatamente dall'abbonamento ChatGPT: verifica budget e limiti su https://platform.openai.com/settings/organization/limits .
4. In `Settings > Actions > General > Workflow permissions`, assicurati che GitHub Actions possa creare pull request e, se necessario, che abbia permessi di lettura e scrittura. Se la policy non consente tali permessi, il job non può pubblicare la PR.
5. Da `Actions > Codex hourly issue agent > Run workflow` puoi lanciare una prova manuale dopo aver integrato questa configurazione in main.

## Sicurezza e funzionamento
- Solo issue create dall'owner del repository; ignora issue con etichette `blocked` e `do-not-automate`.
- Se esiste una PR dell'agente `auto/issue-*` o `codex/issue-*` ancora aperta, attende una revisione prima di avviarne un'altra.
- Il workflow non si attiva per issue pubblicate da estranei, né sui contributi di fork.
- Le modifiche sono limitate ai file di gioco; il modello non deve cambiare i workflow.
- Prima della PR esegue i test e la build web; la build APK viene verificata nella CI della PR.
- Se manca la chiave, il workflow segnala la configurazione mancante e non invoca l'API.
- L'agente non può certificare il realismo grafico o gli FPS sul Samsung senza una prova sul dispositivo.

## Ripristino
Per interrompere l'agente: `Actions > Codex hourly issue agent > ... > Disable workflow`. Per annullare una modifica già integrata, usare `Revert` della PR corrispondente.

## Nota
Le issue e le PR sono dati potenzialmente non affidabili: il workflow accetta solo issue dell'owner. Non inserire mai credenziali nelle issue. Rivedere sempre la diff della PR prima del merge.
