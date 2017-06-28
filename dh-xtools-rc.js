((host, factory) => {
	typeof exports == 'object' && typeof module != 'undefined'
		? factory(exports)
		: host.constructor.name == 'Window' ? factory((host.DHXTools = {})) : factory(host)
		;
})(this, (exports) => {

	const os = Object.prototype.toString;

	let ID = 0;
	const GetId = function GetId(){ return ++ID; }

	class Type{

		static ostr(v){ return os.call(v); }
		static tstr(v){ return typeof(v); }

		static IsObject(v){ return Type.ostr(v) == '[object Object]'; }
		static IsArray(v){ return Type.ostr(v) == '[object Array]'; }
		static IsFunction(v){ return typeof(v) == 'function'; }
		static IsString(v){ return typeof(v) == 'string'; }
		static IsNumber(v){ return typeof(v) == 'number' && !isNaN(v); }
		static IsBoolean(v){ return typeof(v) == 'boolean'; }
		static IsNil(v){ return v === undefined || v === null; }
		static IsLiteral(v){
			return Type.IsNil(v)
				|| Type.IsNumber(v)
				|| Type.IsBoolean(v)
				|| Type.IsString(v)
				;
		}

		static obj(v){ return Type.IsObject(v) }
		static arr(v){ return Type.IsArray(v) }
		static fun(v){ return Type.IsFunction(v) }
		static str(v){ return Type.IsString(v) }
		static num(v){ return Type.IsNumber(v) }
		static nil(v){ return Type.IsNil(v) }
		static boo(v){ return Type.IsBoolean(v) }
		static lit(v){ return Type.IsLiteral(v) }

		static GetTypeName(v){
			if(v === null){
				return 'null';
			} else if(v === undefined){
				return 'undefined';
			} else {
				return v.constructor.name.toLowerCase();
			}
		}
	}

	class AnalyzerItem {
		constructor(){
			this.path = [];
			this.type = null;
		}
	}

	class Analyzer{



		static ObjectWalker(o, key, cb, depth = 0){
			let type = Type.GetTypeName(o);
			cb(o, key, type, depth);
			switch(type){
				case 'object':
					Object.keys(o).forEach(key => {
						Analyzer.ObjectWalker(o[key], key, cb, depth + 1);
					});
					break;
				case 'array':
					o.forEach((val, i) => {
						Analyzer.ObjectWalker(val, i, cb, depth + 1);
					})
					break;
				default:
					break;
			}
		}

		static Map(v, depth = 0, path = [], list = []){
			let type = Type.GetTypeName(v);
			let children = null;
			switch(type){
				case 'object':
					children = {};
					let p = path.slice(0);
					Object.keys(v).forEach(key => {
						let p = path.slice(0);
						p.push(key);
						children[key] = Analyzer.Map(v[key], depth + 1, p, list);
					})
					break;
				case 'array':
					children = {};
					v.forEach((val, key) => {
						let p = path.slice(0);
						p.push(key);
						children[key] = Analyzer.Map(v[key], depth + 1, p, list);
					})
					break;
				default:
					children = null;
					break;
			}
			let r = { type, depth, path };
			if(children != null){
				r.children = children;
			}
			list.push(r);
			return r
		}
	}

	let data = { a: 1, c: { A:9,B:6 }, b: [1,2,3] };
	let list = [];
	let map = Analyzer.Map(data, 0, [], list);
	console.log(map, list)

	// Analyzer.Map(data, 'aaa', function(val, key, type, depth){
	// 	console.log(...arguments)
	// });

	/* XArray */

	class XArray{

		/*
		 * 是否有交集
		 */
		static Cross(a, b){
			return a.some(v => b.indexOf(v) > -1);
		}

		/*
		 * 数组共同值，类似Inner Join
		 */
		static InnerJoin(a, b){
			return a.filter(v => b.indexOf(v) > -1);
		}

		/*
		 * 拼接数组
		 */
		static Connect(){
			return [].concat(...arguments);
		}

		/*
		 * 数组去重
		 */
		static Unique(a){
			return a.filter((v, i, _a) => _a.indexOf(v) === i);
		}
	}

	/* XObject */

	class XObject{

		/*
		 * 以@keys为键值，从@o中产生一个新对象。
		 * @ext 为 false 时，不复制 @o 中不存在的键
		 */
		static Map(keys, o, ext = true){
			let r = {};
			if(ext){
				keys.forEach(k => { r[k] = o[k] });
			} else {
				keys.forEach(k => { if(k in o) r[k] = o[k] });
			}
			return r;
		}

		/*
		 * 对象是否为空
		 */
		static Empty(o){
			for(let p in o) return false;
			return true;
		}

		/*
		 * 返回两个对象键值交集
		 */
		static Join(a, b){
			let ka = Object.keys(a), kb = Object.keys(b);
			let ks = XArray.InnerJoin(ka, kb);
			return [this.map(ks, a), this.map(ks, b)];
		}

		/*
		 * 复制一个对象(浅表)
		 */
		static Clone(o, keys = null){
			if(!Array.isArray(keys)) keys = Object.keys(o);
			return XObject.Map(keys, o, true);
		}

		/*
		 * 以对象 @a(left) 的键作为标准，产生比对结果
		 */
		static LeftDiff(a, b){
			let keys = Object.keys(a), _a = {}, _b = {};
			keys.forEach(k => {
				if(a[k] === b[k]) return;
				_a[k] = a[k];
				_b[k] = b[k];
			});
			return [_a, _b];
		}

		/*
		 * 两个对象所有的键
		 */
		static AllKeys(a, b){
			return XArray.Unique(XArray.Connect(
				Object.keys(a), Object.keys(b)
			));
		}

		/*
		 * 值不同的键
		 */
		static DiffKeys(a, b){
			return XObject.AllKeys(a, b).filter(k => a[k] != b[k]);
		}

		

		/*
		 * 对象差异比对
		 */
		static Diff(a, b){
			let ks = XObject.DiffKeys(a, b);
			return [XObject.Map(ks, a, true), XObject.Map(ks, b, true)];
		}

		/*
		 * copy b to a
		 */
		static Copy(a, b, overwrite = false){
			for(let p in b){
				if(overwrite || !(p in a)) a[p] = b[p];
			}
		}
	}

	class StateListener{

		static Create(val){
			return new StateListener(val);
		}

		constructor(val){
			this._id = GetId();
			this._value = {};
			this._methods = [];
			this.update(val);
		}

		regist(keys, callback/*, value = {}*/){
			
			if(!Type.fun(callback)){
				console.warn('Fatal: Arguments[1] must be a function.');
				return;
			}

			if(!Type.arr(keys)) keys = [keys];

			keys = keys.map(n => n + '');

			let r;
			this._methods.push(r = {
				id: GetId(),
				keys: keys,
				callback: callback
				// , value: Type.obj(value) ? value : {}
			});
			return r;
		}

		_methods_filter(keys){
			return this._methods.filter(m => XArray.Cross(keys, m.keys));
		}

		_fire(diffKeys, newVal, oldVal){
			this._methods_filter(diffKeys).forEach(m => {
				let n = XObject.Map(m.keys, newVal, false);
				let o = XObject.Map(m.keys, oldVal, false);
				XObject.Copy(n, o);
				XObject.Copy(o, n);
				let diff = XObject.DiffKeys(n, o);
				if(diff.length > 0){
					m.callback(n, o, diff);
				}
			})
		}

		set(v){
			if(!Type.obj(v)){
				console.warn('Fatal: Arguments[0] must be a object.');
				return;
			}
			let diff = XObject.DiffKeys(v, this._value);
			if(diff.length < 1) return;

			this._fire(diff, v, this._value);

			this.update(v);
		}

		update(v){
			if(!Type.obj(v)) return;
			XObject.Copy(this._value, v, true);

			// for(let p in v) this._value[p] = v[p];
		}

		reset(){
			console.warn('StateListener[id=' + this.id + '] reset');
			this._value = {};
		}

		map(keys, ext = true){
			return XObject.Map(keys, this._value, ext)
		}

		output(){
			return XObject.Clone(this._value);
		}
	}


	exports.Type = Type;
	exports.XArray = XArray;
	exports.XObject = XObject;
	exports.StateListener = StateListener;

});