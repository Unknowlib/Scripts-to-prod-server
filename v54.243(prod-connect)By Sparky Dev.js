const base = Module.findBaseAddress('libg.so');

const Libg = {
	init() {
		Libg.module = Process.findModuleByName('libg.so');
		Libg.size = Libg.module.size;
		Libg.begin = Libg.module.base;
		Libg.end = ptr(Libg.begin.toInt32() + Libg.size);
	},
	offset(value) {
		return Libg.begin.add(value);
	}
}

const Armceptor = {
    replace(ptr, arr) {
		Memory.protect(ptr, arr.length, "rwx");
		Memory.writeByteArray(ptr, arr);
		Memory.protect(ptr, arr.length, "rx");
	},
    replaceStr(ptr, value) {
        Memory.protect(ptr, value.length, "rwx");
        Memory.writeUtf8String(ptr, value);
        Memory.protect(ptr, value.length, "rx");
    },
	jumpout(addr, target) {
		Memory.patchCode(addr, Process.pageSize, function(code) {
			var writer = new ArmWriter(code, {
				pc: addr
			});
			writer.putBranchAddress(target);
			writer.flush();
		});
	},
    ret(ptr) {
        Armceptor.replace(ptr, [0x1E, 0xFF, 0x2F, 0xE1]);
    }
}

function WriteToMemory(address, valueType, value) {
    switch (valueType.toLowerCase()) {
        case "u8":
            Memory.protect(address, 1, "rwx");
            Memory.writeU8(address, value);
            break;
        case "byte":
            Memory.protect(address, 1, "rwx");
            Memory.writeS8(address, value);
            break;
        case "ushort":
            Memory.protect(address, 2, "rwx");
            Memory.writeU16(address, value);
            break;
        case "short":
            Memory.protect(address, 2, "rwx");
            Memory.writeS16(address, value);
            break;
        case "uint":
            Memory.protect(address, 4, "rwx");
            Memory.writeU32(address, value);
            break;
        case "int":
            Memory.protect(address, 4, "rwx");
            Memory.writeS32(address, value);
            break;
        case "float":
            Memory.protect(address, 4, "rwx");
            Memory.writeFloat(address, value);
            break;
        case "pointer":
            Memory.protect(address, 4, "rwx");
            Memory.writePointer(address, value);
            break;
        case "ulong":
            Memory.protect(address, 8, "rwx");
            Memory.writeU64(address, value);
            break;
        case "long":
            Memory.protect(address, 8, "rwx");
            Memory.writeS64(address, value);
            break;
        case "double":
            Memory.protect(address, 8, "rwx");
            Memory.writeDouble(address, value);
            break;
        case "bytearray":
            Memory.protect(address, value.length, "rwx");
            Memory.writeByteArray(address, value);
            break;
        case "string":
            Memory.protect(address, value.length, "rwx");
            Memory.writeUtf8String(address, value);
            break;
    }
}

const Connect = {
	init() {
		Interceptor.attach(Libg.offset(0x4212D8), { // ServerConnection::connectTo
			onEnter(args) {
                var ip = "game.brawlstarsgame.com";
				args[1].add(8).readPointer().writeUtf8String(ip);
                console.log(Libg.offset(0x12BE68))
                Log.Line('[ServerConnection::connectTo] Connecting to ' + ip);
                //SetupMessaging.init();
			}
		});
	}
}

const Misc = {
    init() {
  
      Interceptor.replace(Libg.offset(DebuggerFnc.error), new NativeCallback(function(ErrorStr) {
          Log.line(FormatLog(0, ErrorStr.readUtf8String()));
      }, 'void', ['pointer']));
  
      Interceptor.replace(Libg.offset(DebuggerFnc.warning), new NativeCallback(function(WarningStr) {
          if (WarningStr.readUtf8String() != 'Unsupported pixel format 263 passed to GLImage::determineFormat.') {
              Log.Line(FormatLog(1, WarningStr.readUtf8String()));
          }
      }, 'void', ['pointer']));
  
      WriteToMemory(Libg.offset(0x56CD04), 'Byte', 0) // LogicVersion::isChinaVersion
  
      WriteToMemory(Libg.offset(0x56CCDC), 'Byte', 0) // LogicVersion::isProd
      WriteToMemory(Libg.offset(0x56CCEC), 'Byte', 1) // LogicVersion::isDev
      WriteToMemory(Libg.offset(0x56CD0C), 'Byte', 1) // LogicVersion::isDeveloperBuild

      Log.line('[Misc] Load!')
  
    }
  }

rpc.exports.init = function() {
    Libg.init();
    Connect.init();
    Misc.init();
}