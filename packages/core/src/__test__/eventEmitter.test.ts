import {
  describe,
  test,
  expect,
  it,
  vi
} from 'vitest'
import EventEmitter from '../libs/EventEmitter'

describe('EventEmitter', () => {
  const emitter = new EventEmitter()

  it('on', () => {
    let val: string
    emitter.on('change', (value: string) => {
      val = value
    })
    test('called', () => {
      val = ''
      emitter.emit('change', '123')
      expect(val).toEqual('123')
    })
    test('uncalled', () => {
      val = ''
      emitter.emit('close', '123')
      expect(val).toBe('')
    })
  })

  test('emit', () => {
    let val = ''
    emitter.events.change = [
      () => {
        val = '123'
      },
      () => {
        val = '456'
      }
    ]
    emitter.emit('change')
    expect(val).toEqual('456')
  })

  it('once', () => {
    let val: string
    emitter.once('change', (value: string) => {
      val = value
    })
    test('called', () => {
      val = ''
      emitter.emit('change', '123')
      expect(val).toEqual('123')
    })
    test('uncalled', () => {
      val = ''
      emitter.emit('change', '123')
      expect(val).toBe('')
    })
  })

  it('off', () => {
    let val: string
    const callback = (value: string) => {
      val = value
    }
    emitter.on('change', callback)
    test('called', () => {
      val = ''
      emitter.emit('change', '123')
      expect(val).toEqual('123')
    })
    emitter.off('change', callback)
    test('uncalled', () => {
      val = ''
      emitter.emit('change', '123')
      expect(val).toBe('')
    })
  })

  it('clear', () => {
    let val: string
    const callback = (value: string) => {
      val = value
    }
    emitter.on('change', callback)
    test('called', () => {
      val = ''
      emitter.emit('change', '123')
      expect(val).toEqual('123')
    })
    emitter.clear()
    test('uncalled', () => {
      val = ''
      emitter.emit('change', '123')
      expect(val).toBe('')
    })
  })

  test('maxListener', () => {
    const consoleSpy = vi.spyOn(console, 'warn')
    emitter.maxListener = 1
    emitter.on('change', () => {
      //
    })

    emitter.on('change', () => {
      //
    })

    expect(consoleSpy).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('监听的事件不能超过设置的最大监听数。'))
  })

  test('eventNames', () => {
    emitter.clear()
    emitter.on('open', () => {
      //
    })
    emitter.on('close', () => {
      //
    })
    expect(emitter.eventNames).toEqual(['open', 'close'])
  })
})
