import { SmartC } from '../smartc'

describe('Logical tests, one operation', () => {
    it('should compile: variable', () => {
        const code = 'long a; if (a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: constant', () => {
        const code = 'long a; if (0) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: constant', () => {
        const code = 'long a; if (1) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: constant', () => {
        const code = 'long a; if (10) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: operator', () => {
        const code = 'long a; if (a/2) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nDIV @r0 $r1\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: operator', () => {
        const code = 'long a; if (a%2) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nMOD @r0 $r1\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: operator', () => {
        const code = 'long a; if (a<<2) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nSHL @r0 $r1\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: operator', () => {
        const code = 'long a; if (a>>2) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nSET @r1 #0000000000000002\nSHR @r0 $r1\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: operator', () => {
        const code = 'long a; if (a|2) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #0000000000000002\nBOR @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: operator', () => {
        const code = 'long a; if (a^2) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 #0000000000000002\nXOR @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: UnaryOperator', () => {
        const code = 'long a; if (!a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nBNZ $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: UnaryOperator', () => {
        const code = 'long a; if (~a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nNOT @r0\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: SetUnaryOperator in logical operations', () => {
        expect(() => {
            const code = 'long a; if (++a) { a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: SetUnaryOperator in logical operations', () => {
        expect(() => {
            const code = 'long a; if (a++) { a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: Assignment in logical operations', () => {
        expect(() => {
            const code = 'long a; if (a=b) { a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    test('should throw: SetOperator in logical operations', () => {
        expect(() => {
            const code = 'long a; if (a+=b) { a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: Comparision ==', () => {
        const code = 'long a, b; if (a==b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision !=', () => {
        const code = 'long a, b; if (a!=b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBEQ $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision >=', () => {
        const code = 'long a, b; if (a>=b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBLT $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision >', () => {
        const code = 'long a, b; if (a>b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBLE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision <=', () => {
        const code = 'long a, b; if (a<=b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBGT $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision <', () => {
        const code = 'long a, b; if (a<b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBGE $a $b :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision ==0', () => {
        const code = 'long a, b; if (a==0) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision !==0', () => {
        const code = 'long a, b; if (a!=0) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision &&', () => {
        const code = 'long a, b; if (a&&b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBZR $a :__if1_endif\nBZR $b :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision ||', () => {
        const code = 'long a, b; if (a||b) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nBNZ $a :__if1_start\nBNZ $b :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision mix', () => {
        const code = 'long a, b, c, d; if (a==b&&c==d) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBNE $a $b :__if1_endif\nBNE $c $d :__if1_endif\nJMP :__if1_start\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Comparision mix', () => {
        const code = 'long a, b, c, d; if (a==b||c==d) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n^declare c\n^declare d\n\nBEQ $a $b :__if1_start\nBEQ $c $d :__if1_start\nJMP :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Pointer (Arr notation)', () => {
        const code = 'long *a, b; if (a[b]) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $($a + $b)\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Arr', () => {
        const code = 'long a[2], b; if (a[b]) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^const SET @a #0000000000000004\n^declare a_0\n^declare a_1\n^declare b\n\nSET @r0 $($a + $b)\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: CheckOperator Unary', () => {
        const code = 'long a; if (+a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nBZR $a :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: Pointer (CheckOperator Unary)', () => {
        const code = 'long *a; if (*a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $($a)\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: CheckOperator Unary', () => {
        const code = 'long a; if (-a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nCLR @r0\nSUB @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: CheckOperator Unary', () => {
        const code = 'long a; if (~a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n\nSET @r0 $a\nNOT @r0\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: CheckOperator Unary Address', () => {
        expect(() => {
            const code = 'long a; if (&a) { a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
    it('should compile: CheckOperator Binary', () => {
        const code = 'long a, b; if (b+a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nADD @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: CheckOperator Binary', () => {
        const code = 'long a, b; if (b*a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nMUL @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: CheckOperator Binary', () => {
        const code = 'long a, b; if (b-a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nSUB @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    it('should compile: CheckOperator Binary', () => {
        const code = 'long a, b; if (b&a) { a++; }'
        const assembly = '^declare r0\n^declare r1\n^declare r2\n^declare a\n^declare b\n\nSET @r0 $b\nAND @r0 $a\nBZR $r0 :__if1_endif\n__if1_start:\nINC @a\n__if1_endif:\nFIN\n'
        const compiler = new SmartC({ language: 'C', sourceCode: code })
        compiler.compile()
        expect(compiler.getAssemblyCode()).toBe(assembly)
    })
    test('should throw: Delimiter in logical expression', () => {
        expect(() => {
            const code = 'long a, b; if (a,b) { a++; }'
            const compiler = new SmartC({ language: 'C', sourceCode: code })
            compiler.compile()
        }).toThrowError(/^At line/)
    })
})
