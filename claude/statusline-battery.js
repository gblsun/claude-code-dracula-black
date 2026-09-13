// Lê a bateria via WMI e imprime "<porcentagem> <status>". Usado pela status line no Windows.
// Roda com: cscript //nologo statusline-battery.js (bem mais rápido que abrir o PowerShell).
var wmi = GetObject("winmgmts:\\\\.\\root\\cimv2");
var items = new Enumerator(wmi.ExecQuery("SELECT EstimatedChargeRemaining, BatteryStatus FROM Win32_Battery"));
if (!items.atEnd()) {
  var battery = items.item();
  WScript.Echo(battery.EstimatedChargeRemaining + " " + battery.BatteryStatus);
}
