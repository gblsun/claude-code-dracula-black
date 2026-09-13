// Coleta dados do Windows para a status line via WMI e imprime uma informação por linha:
//   BAT <porcentagem> <status>     bateria (só em notebooks)
//   RAM <mhz>                      velocidade em que a memória está rodando
//   DISK <letra> <livre> <total>   cada disco local, em bytes
//   GPU <placa> <tempo>            tempo de uso 3D acumulado de cada placa, em 100 ns
// Roda com: cscript //nologo statusline-windows.js (bem mais rápido que abrir o PowerShell).
var wmi = GetObject("winmgmts:\\\\.\\root\\cimv2");
var out = [];

var batteries = new Enumerator(wmi.ExecQuery("SELECT EstimatedChargeRemaining, BatteryStatus FROM Win32_Battery"));
if (!batteries.atEnd()) {
  out.push("BAT " + batteries.item().EstimatedChargeRemaining + " " + batteries.item().BatteryStatus);
}

// Velocidade configurada da memória; se o módulo não informar, a velocidade nominal.
var modules = new Enumerator(wmi.ExecQuery("SELECT Speed, ConfiguredClockSpeed FROM Win32_PhysicalMemory"));
for (; !modules.atEnd(); modules.moveNext()) {
  var mhz = modules.item().ConfiguredClockSpeed || modules.item().Speed;
  if (mhz) {
    out.push("RAM " + mhz);
    break;
  }
}

var disks = new Enumerator(wmi.ExecQuery("SELECT DeviceID, FreeSpace, Size FROM Win32_LogicalDisk WHERE DriveType = 3"));
for (; !disks.atEnd(); disks.moveNext()) {
  if (disks.item().Size) out.push("DISK " + disks.item().DeviceID + " " + disks.item().FreeSpace + " " + disks.item().Size);
}

// Contadores brutos (sem espera de amostragem): a status line calcula o uso pela diferença entre duas leituras.
var engines = new Enumerator(wmi.ExecQuery("SELECT Name, RunningTime FROM Win32_PerfRawData_GPUPerformanceCounters_GPUEngine WHERE Name LIKE '%engtype_3D'"));
var perAdapter = {};
for (; !engines.atEnd(); engines.moveNext()) {
  var match = /luid_(0x[0-9a-fA-F]+_0x[0-9a-fA-F]+)/.exec(engines.item().Name);
  if (match) perAdapter[match[1]] = (perAdapter[match[1]] || 0) + parseFloat(engines.item().RunningTime);
}
for (var luid in perAdapter) out.push("GPU " + luid + " " + perAdapter[luid]);

WScript.Echo(out.join("\n"));
