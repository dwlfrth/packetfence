import { computed, inject, ref, toRefs, watch } from '@vue/composition-api'
import { createDebouncer } from 'promised-debounce'
import yup from '@/utils/yup'

export const useInputValidatorProps = {
  namespace: {
    type: String
  },
  state: {
    type: Boolean,
    default: null
  },
  invalidFeedback: {
    type: String,
    default: undefined
  },
  validFeedback: {
    type: String,
    default: undefined
  },
  validator: {
    type: Object
  }
}

export const useInputValidator = (props, value, recursive = false) => {

  const {
    namespace,
    state,
    invalidFeedback,
    validFeedback,
    validator
  } = toRefs(props) // toRefs maintains reactivity w/ destructuring

  // defaults (dereferenced)
  let localState = ref(state.value)
  let localInvalidFeedback = ref(invalidFeedback.value)
  let localValidFeedback = ref(validFeedback.value)

  // yup | https://github.com/jquense/yup
  let localValidator = ref(validator.value)

  let form = ref(undefined)
  let path = ref(undefined)

  if (namespace.value) { // is :namespace

    // recompose namespace into yup path (eg: array.1 => array[1])
    path = computed(() => namespace.value.split('.').reduce((path, part) => {
      return (`${+part}` === `${part}`)
        ? [ ...path.slice(0, path.length -1), `${path[path.length - 1]}[${part}]` ]
        : [ ...path, part ]
    }, []).join('.'))

    form = inject('form')
    localValidator = inject('schema')

    /*
    localValidator = computed(() => {
      return schema.value
      // reach throws an exception when a path is not defined in the schema
      //  https://github.com/jquense/yup/issues/599
      try {
        const namespaceSchema = reach(schema.value, path.value)
        if (validator.value)
          return validator.value.concat(namespaceSchema) // merge schemas
        else
          return namespaceSchema
      } catch (e) { // path not defined in schema
        if (validator.value)
          return validator.value // fallback to prop
        return object().nullable() // fallback to placeholder
      }
    })
    */
  }

  if (localValidator.value) { // is :validator
    const meta = inject('meta', ref({}))
    let lastPromise = 0 // only use latest of 1+ promises
    const setState = (thisPromise, state, validFeedback, invalidFeedback) => {
      if (thisPromise === lastPromise) {
        if (state !== localState.value) {
          // mutate meta to re-trigger [form, meta] watchers
          meta.value.$lastTouch = (new Date()).getTime()
        }
        localState.value = state
        localValidFeedback.value = validFeedback
        localInvalidFeedback.value = invalidFeedback
      }
    }

    let validateDebouncer
    watch(
      [value, localValidator, validFeedback],
      () => {
        const schema = localValidator.value
        const thisPromise = ++lastPromise

        if (!validateDebouncer)
          validateDebouncer = createDebouncer()
        validateDebouncer({
          handler: () => {
            let validationPromise
            if (namespace.value) { // use namespace/path
              // yup throws an exception when a path is not defined in the schema
              //  https://github.com/jquense/yup/issues/599
              try {
                validationPromise = schema.validateAt(path.value, form.value, { recursive, abortEarly: !recursive })
              } catch (e) { // path not defined in schema
                validationPromise = true
              }
            }
            else
              validationPromise = schema.validate(value.value, { recursive, abortEarly: !recursive }) // use value

            Promise.resolve(validationPromise).then(() => { // valid
              if (validFeedback.value !== undefined)
                setState(thisPromise, true, validFeedback.value, null)
              else
                setState(thisPromise, null, null, null)

            }).catch(ValidationError => { // invalid
              const { inner = [], message } = ValidationError
              let _schema = schema
              if (recursive && namespace.value) {
                _schema = yup.reach(schema, path.value) // use namespace/path
              }
              try {
                const { meta: { invalidFeedback: metaInvalidFeedback } = {} } = _schema.describe()
                if (metaInvalidFeedback) { // mask messages
                  setState(thisPromise, false, null, metaInvalidFeedback)
                  return
                }
              } catch(e) {/* noop */}
              if (recursive && inner.length) { // concatenate messages
                const uniqueInner = [...(new Set(inner.map(({ message }) => message)))] // unique
                setState(thisPromise, false, null, uniqueInner.join(' '))
                return
              }
              setState(thisPromise, false, null, message)
            })
          },
          time: 300
        })
      },
      { deep: true, immediate: true }
    )
  }
  else { // no :validator
    localInvalidFeedback = invalidFeedback
    localValidFeedback = validFeedback
    localState = computed(() => {
      if (state.value !== false)
        return (validFeedback.value !== undefined)
          ? true // is validFeedback
          : null // no validFeeback
      return false
    })
  }

  return {
    state: localState,
    invalidFeedback: localInvalidFeedback,
    validFeedback: localValidFeedback
  }
}
