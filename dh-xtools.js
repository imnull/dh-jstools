((host, factory) => {
	typeof exports == 'object' && typeof module != 'undefined'
		? factory(exports)
		: host.constructor.name == 'Window' ? factory((host.DHXTools = {})) : factory(host)
		;
})(this, (exports) => {

	const os = Object.prototype.toString;

	const T = {
		obj: v => v && os.call(v) == '[object Object]',
		arr: v => v && os.call(v) == '[object Array]',
		fun: v => typeof(v) == 'function',
		str: v => typeof(v) == 'string'
	};

	let ID = 0;

	function GetId(){ return ++ID; }

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
				if(p in a && !overwrite) continue;
				a[p] = b[p];
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
			
			if(!T.fun(callback)){
				console.warn('Fatal: Arguments[1] must be a function.');
				return;
			}

			if(!T.arr(keys)) keys = [keys];

			keys = keys.map(n => n + '');

			let r;
			this._methods.push(r = {
				id: GetId(),
				keys: keys,
				callback: callback
				// , value: T.obj(value) ? value : {}
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
			if(!T.obj(v)){
				console.warn('Fatal: Arguments[0] must be a object.');
				return;
			}
			let diff = XObject.DiffKeys(v, this._value);
			if(diff.length < 1) return;

			this._fire(diff, v, this._value);

			this.update(v);
		}

		update(v){
			if(!T.obj(v)) return;
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

	const CHARTS_XY = {
		"Bar": {
			"title": "柱状图",
			"desc": [ "2个以内维度", "1个或多个度量"]
			, "judge": [[0, 2, 1, -1]]
		},
		"BarStack": {
			"title": "堆积柱图",
			"desc": [ "2个以内维度", "2个或多个度量" ]
			, "judge": [[0, 2, 2, -1]]
		},
		"HBar": {
			"title": "条图",
			"desc": [ "2个以内维度", "1个或多个度量" ]
			, "judge": [[0, 2, 1, -1]]
		},
		 "HBarStack": {
			"title": "堆积条图",
			"desc": [ "2个以内维度", "2个或多个度量" ]
			, "judge": [[0, 2, 2, -1]]
		},
		"Line": {
			"title": "折线图",
			"desc": [ "2个以内维度", "1个或多个度量"]
			, "judge": [[0, 2, 1, -1]]
		},
		"Area": {
			"title": "面积图",
			"desc": [ "2个以内维度", "1个或多个度量" ]
			, "judge": [[0, 2, 1, -1]]
		},
		"Biaxial": {
			"title": "双轴图",
			"desc": [ "2个以内维度", "2个或多个度量"]
			, "judge": [[0, 2, 2, -1]]
		},
		"Scatter": {
			"title": "散点图",
			"desc": [ "3个以内维度", "2个度量"]
			, "judge": [[0, 3, 2, 2]]
		},
		"Map": {
			"title": "地图",
			"desc": [ "1个维度", "1个度量"]
			, "judge": [[1, 1, 1, 1]]
		},
		"MapBubble": {
			"title": "地图气泡图",
			"desc": [ "1个维度", "1个或2个度量"]
			, "judge": [[1, 1, 1, 2]]
		},
		"Pie": {
			"title": "饼图",
			"desc": [ "1个维度1个度量", "0个维度多个度量"]
			, "judge": [[1, 1, 1, 2], [0, 0, 0, -1]]
		},
		"Table": {
			"title": "表格",
			"desc": [ "0个或多个维度", "0个或多个度量"]
			, "judge": [[0, -1, 0, -1]]
		},
		"TreeMap": {
			"title": "矩形树图",
			"desc": [ "1个或2个维度", "1个或2个度量"]
			, "judge": [[1, 2, 1, 2]]
		}
	};

	class WidgetBlackBox{

		static RangeJudge(val, min, max){
			if(max < 0){
				return val >= min;
			} else {
				return val >= min && val <= max;
			}
		}

		static MatrixJudge(x, y, mat){
			return WidgetBlackBox.RangeJudge(x, mat[0], mat[1]) &&
				WidgetBlackBox.RangeJudge(y, mat[2], mat[3]);
		}
		static Judge(x, y, mats){
			return mats.some(mat => WidgetBlackBox.MatrixJudge(x, y, mat))
		}

		static CalWeight(x, y, mat){
			const INFI = 10;

			let wx = x;
			let wy = y;
			if(mat[1] < 0){
				wx /= INFI;
			} else {
				wx /= mat[1] - mat[0] + 1;
			}

			if(mat[3] < 0){
				wy /= INFI;
			} else {
				wy /= mat[3] - mat[2] + 1;
			}

			return wx * wy;
		}

		static CalWeights(x, y, mats){
			let n = 0;
			mats.forEach(mat => {
				n += WidgetBlackBox.CalWeight(x, y, mat);
			});
			return n / mats.length;
		}

		static Create(defaultVal, callback){

			if(!T.fun(callback)){
				console.error('Fatal: Arguments[1] should be a function');
				return;
			}

			let charts_list = Object.keys(CHARTS_XY).map(k => ({
				type: k,
				judge: CHARTS_XY[k].judge, weight: (CHARTS_XY[k].weight || 1)
			}));

			let listener = StateListener.Create(defaultVal);

			listener.regist(['x', 'y', 'type'], (newVal, oldVal, diff) => {
				let { x, y, type } = newVal;

				let charts = charts_list.filter(c => WidgetBlackBox.Judge(x, y, c.judge)).map(c => {
					return { type: c.type, weight: c.weight * WidgetBlackBox.CalWeights(x, y, c.judge) }
				});
				let charts_no = charts_list.filter(c => !charts.some(cc => cc.type === c.type));

				charts.sort((a, b) => {
					return b.weight - a.weight;
				});

				charts = charts.map(c => c.type);
				charts_no = charts_no.map(c => c.type);

				callback({
					type: type || charts[0],
					yes: charts,
					no: charts_no
				});
			});

			return {
				set(v){ listener.set(v); }
			}
		}

		static Create2(defaultVal){

			let charts_list = Object.keys(CHARTS_XY).map(k => ({
				type: k,
				judge: CHARTS_XY[k].judge, weight: (CHARTS_XY[k].weight || 1)
			}));

			let listener = StateListener.Create(defaultVal);

			let CALLBACK = null;
			listener.regist(['x', 'y', 'type'], (newVal, oldVal, diff) => {

				let { x, y, type } = newVal;

				let charts = charts_list.filter(c => WidgetBlackBox.Judge(x, y, c.judge)).map(c => {
					return { type: c.type, weight: c.weight * WidgetBlackBox.CalWeights(x, y, c.judge) }
				});
				let charts_no = charts_list.filter(c => !charts.some(cc => cc.type === c.type));

				charts.sort((a, b) => {
					return b.weight - a.weight;
				});

				charts = charts.map(c => c.type);
				charts_no = charts_no.map(c => c.type);
				
				let r = {
					type: type || charts[0],
					yes: charts,
					no: charts_no
				};

				if(T.fun(CALLBACK)){
					CALLBACK(r);
				}

				return r;
			});

			return {
				listen(cb, x, y, type){
					CALLBACK = cb;
					listen.set({ x, y, type });
				}
			}

		}

	}

	exports.XArray = XArray;
	exports.XObject = XObject;
	exports.StateListener = StateListener;
	exports.Type = T;
	exports.GetId = GetId;
	exports.WidgetBlackBox = WidgetBlackBox;

});