'use client';
import React, {
  memo,
  useState,
  useEffect,
  useRef,
  forwardRef,
} from 'react';
import {
  motion,
  useAnimation,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== Image Helper for Vite / React ====================

const Image = memo(function Image({ width, height, alt = '', className, ...props }) {
  return (
    <img
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      {...props}
    />
  );
});

// ==================== Input Component ====================

const Input = memo(
  forwardRef(function Input(
    { className, type, ...props },
    ref
  ) {
    const radius = 120; // Radius of hover spotlight effect
    const [visible, setVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({
      currentTarget,
      clientX,
      clientY,
    }) {
      const { left, top } = currentTarget.getBoundingClientRect();

      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
          #059669,
          transparent 80%
        )
      `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className='group/input rounded-xl p-[2px] transition duration-300 bg-stone-200/80 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-700/80'
      >
        <input
          type={type}
          className={cn(
            `shadow-input dark:placeholder-text-neutral-500 flex h-11 w-full rounded-[10px] border-none bg-stone-50/90 px-3.5 py-2 text-sm text-stone-900 transition duration-300 group-hover/input:shadow-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-400 focus-visible:ring-[2px] focus-visible:ring-emerald-700/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-950 dark:text-stone-100 dark:shadow-[0px_0px_1px_1px_#404040] dark:focus-visible:ring-emerald-500/30`,
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  })
);

Input.displayName = 'Input';

// ==================== BoxReveal Component ====================

const BoxReveal = memo(function BoxReveal({
  children,
  width = 'fit-content',
  boxColor,
  duration,
  overflow = 'hidden',
  position = 'relative',
  className,
}) {
  const mainControls = useAnimation();
  const slideControls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      slideControls.start('visible');
      mainControls.start('visible');
    } else {
      slideControls.start('hidden');
      mainControls.start('hidden');
    }
  }, [isInView, mainControls, slideControls]);

  return (
    <section
      ref={ref}
      style={{
        position,
        width,
        overflow,
      }}
      className={className}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial='hidden'
        animate={mainControls}
        transition={{ duration: duration ?? 0.5, delay: 0.25 }}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: '100%' } }}
        initial='hidden'
        animate={slideControls}
        transition={{ duration: duration ?? 0.5, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor ?? '#047857',
          borderRadius: 4,
        }}
      />
    </section>
  );
});

// ==================== Ripple Component ====================

const Ripple = memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 11,
  className = '',
}) {
  return (
    <section
      className={cn(
        `absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden
        dark:bg-white/5 bg-stone-100/40
        [mask-image:linear-gradient(to_bottom,black,transparent)]
        dark:[mask-image:linear-gradient(to_bottom,white,transparent)]`,
        className
      )}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = Math.max(0.04, mainCircleOpacity - i * 0.02);
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = i === numCircles - 1 ? 'dashed' : 'solid';

        return (
          <span
            key={i}
            className='absolute animate-ripple rounded-full border'
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              animationDelay: animationDelay,
              borderStyle: borderStyle,
              borderWidth: '1px',
              borderColor: 'rgba(4, 120, 87, 0.25)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </section>
  );
});

// ==================== OrbitingCircles Component ====================

const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}) {
  return (
    <>
      {path && (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          version='1.1'
          className='pointer-events-none absolute inset-0 size-full'
        >
          <circle
            className='stroke-stone-400/30 stroke-1 dark:stroke-stone-700/40'
            strokeDasharray='4 4'
            cx='50%'
            cy='50%'
            r={radius}
            fill='none'
          />
        </svg>
      )}
      <div
        style={{
          '--duration': duration,
          '--radius': radius,
          '--delay': -delay,
        }}
        className={cn(
          'pointer-events-none absolute inset-0 size-full flex items-center justify-center transform-gpu animate-orbit [animation-delay:calc(var(--delay)*1000ms)]',
          { '[animation-direction:reverse]': reverse },
          className
        )}
      >
        <div className='pointer-events-auto'>
          {children}
        </div>
      </div>
    </>
  );
});

// ==================== TechOrbitDisplay Component ====================

const TechOrbitDisplay = memo(function TechOrbitDisplay({
  iconsArray,
  text = 'DepositGuard',
  children,
}) {
  return (
    <section className='relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg'>
      {/* 1. Orbit Tracks & Orbiting Icons (Rendered in Background) */}
      {iconsArray.map((icon, index) => (
        <OrbitingCircles
          key={index}
          className={icon.className}
          duration={icon.duration}
          delay={icon.delay}
          radius={icon.radius}
          path={icon.path}
          reverse={icon.reverse}
        >
          {icon.component()}
        </OrbitingCircles>
      ))}

      {/* 2. Central Brand Anchor (Rendered in Foreground with z-20) */}
      <div className='relative z-20 flex items-center justify-center'>
        {children ?? (
          <span className='pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-stone-900 via-stone-700 to-stone-400 bg-clip-text text-center text-5xl sm:text-6xl font-extrabold leading-none text-transparent dark:from-white dark:to-stone-600'>
            {text}
          </span>
        )}
      </div>
    </section>
  );
});

// ==================== AnimatedForm Component ====================

const AnimatedForm = memo(function AnimatedForm({
  header,
  subHeader,
  fields,
  submitButton,
  textVariantButton,
  errorField,
  fieldPerRow = 1,
  onSubmit,
  googleLogin,
  onGoogleLogin,
  goTo,
  topCustomContent,
  bottomCustomContent,
}) {
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState({});

  const toggleVisibility = () => setVisible(!visible);

  const validateForm = (event) => {
    const currentErrors = {};
    fields.forEach((field) => {
      const fieldKey = field.name || field.label;
      const inputEl = event.target[fieldKey];
      const value = field.value !== undefined ? field.value : inputEl?.value;

      if (field.required && !value) {
        currentErrors[field.label] = `${field.label} is required`;
      }

      if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        currentErrors[field.label] = 'Invalid email address';
      }

      if (field.type === 'password' && value && value.length < 6) {
        currentErrors[field.label] =
          'Password must be at least 6 characters long';
      }
    });
    return currentErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formErrors = validateForm(event);

    if (Object.keys(formErrors).length === 0) {
      onSubmit(event);
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <section className='w-full max-w-md flex flex-col gap-4 mx-auto'>
      <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
        <h2 className='font-extrabold text-3xl tracking-tight text-stone-900 dark:text-stone-100'>
          {header}
        </h2>
      </BoxReveal>

      {subHeader && (
        <BoxReveal boxColor='var(--skeleton)' duration={0.3} className='pb-2'>
          <p className='text-stone-600 text-xs sm:text-sm max-w-sm dark:text-stone-300 leading-relaxed'>
            {subHeader}
          </p>
        </BoxReveal>
      )}

      {topCustomContent && (
        <BoxReveal boxColor='var(--skeleton)' duration={0.3} width='100%'>
          {topCustomContent}
        </BoxReveal>
      )}

      {googleLogin && (
        <>
          <BoxReveal
            boxColor='var(--skeleton)'
            duration={0.3}
            overflow='visible'
            width='100%'
          >
            <button
              className='g-button group/btn bg-white dark:bg-stone-900/60 w-full rounded-xl border border-stone-300/80 dark:border-stone-700 h-11 font-semibold text-xs text-stone-800 dark:text-stone-200 outline-none hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer shadow-xs'
              type='button'
              onClick={onGoogleLogin ?? (() => console.log('Google login clicked'))}
            >
              <span className='flex items-center justify-center w-full h-full gap-2.5'>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {googleLogin}
              </span>
              <BottomGradient />
            </button>
          </BoxReveal>

          <BoxReveal boxColor='var(--skeleton)' duration={0.3} width='100%'>
            <section className='flex items-center gap-3 my-1'>
              <hr className='flex-1 border-t border-dashed border-stone-300 dark:border-stone-700' />
              <p className='text-stone-500 font-mono text-xs uppercase tracking-wider'>
                or
              </p>
              <hr className='flex-1 border-t border-dashed border-stone-300 dark:border-stone-700' />
            </section>
          </BoxReveal>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <section
          className={`grid grid-cols-1 ${fieldPerRow > 1 ? `md:grid-cols-${fieldPerRow} gap-3` : 'space-y-3'}`}
        >
          {fields.map((field) => (
            <section key={field.label} className='flex flex-col gap-1.5'>
              <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
                <Label htmlFor={field.name || field.label} className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  {field.label} {field.required && <span className='text-rose-500'>*</span>}
                </Label>
              </BoxReveal>

              <BoxReveal
                width='100%'
                boxColor='var(--skeleton)'
                duration={0.3}
                className='flex flex-col space-y-1 w-full'
              >
                <section className='relative'>
                  <Input
                    type={
                      field.type === 'password'
                        ? visible
                          ? 'text'
                          : 'password'
                        : field.type
                    }
                    id={field.name || field.label}
                    name={field.name || field.label}
                    value={field.value}
                    placeholder={field.placeholder}
                    onChange={field.onChange}
                  />

                  {field.type === 'password' && (
                    <button
                      type='button'
                      onClick={toggleVisibility}
                      className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer'
                      aria-label={visible ? 'Hide password' : 'Show password'}
                    >
                      {visible ? (
                        <Eye className='h-4 w-4' />
                      ) : (
                        <EyeOff className='h-4 w-4' />
                      )}
                    </button>
                  )}
                </section>

                {errors[field.label] && (
                  <p className='text-rose-500 text-[11px] font-medium pt-0.5'>
                    {errors[field.label]}
                  </p>
                )}
              </BoxReveal>
            </section>
          ))}
        </section>

        {errorField && (
          <BoxReveal width='100%' boxColor='var(--skeleton)' duration={0.3}>
            <div className='p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium'>
              {errorField}
            </div>
          </BoxReveal>
        )}

        <BoxReveal
          width='100%'
          boxColor='var(--skeleton)'
          duration={0.3}
          overflow='visible'
        >
          <button
            className='bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-950 w-full rounded-xl h-11 font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-stone-900/10 hover:shadow-lg transition-all duration-200 relative group/btn cursor-pointer flex items-center justify-center gap-2 mt-2'
            type='submit'
          >
            <span>{submitButton}</span>
            <span>&rarr;</span>
            <BottomGradient />
          </button>
        </BoxReveal>

        {bottomCustomContent && (
          <BoxReveal boxColor='var(--skeleton)' duration={0.3} width='100%'>
            {bottomCustomContent}
          </BoxReveal>
        )}

        {textVariantButton && goTo && (
          <BoxReveal boxColor='var(--skeleton)' duration={0.3} width='100%'>
            <section className='pt-2 text-center'>
              <button
                type='button'
                className='text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 transition cursor-pointer underline underline-offset-4'
                onClick={goTo}
              >
                {textVariantButton}
              </button>
            </section>
          </BoxReveal>
        )}
      </form>
    </section>
  );
});

const BottomGradient = () => {
  return (
    <>
      <span className='group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent' />
      <span className='group-hover/btn:opacity-100 blur-xs block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-teal-400 to-transparent' />
    </>
  );
};

// ==================== AuthTabs Component ====================

const AuthTabs = memo(function AuthTabs({
  formFields,
  goTo,
  handleSubmit,
  googleLogin,
  onGoogleLogin,
  className,
}) {
  return (
    <div className={cn('w-full flex flex-col justify-center items-center', className)}>
      <AnimatedForm
        {...formFields}
        fieldPerRow={1}
        onSubmit={handleSubmit}
        goTo={goTo}
        googleLogin={googleLogin}
        onGoogleLogin={onGoogleLogin}
      />
    </div>
  );
});

// ==================== Label Component ====================

const Label = memo(function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        'text-xs font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
});

// ==================== Exports ====================

export {
  Input,
  BoxReveal,
  Ripple,
  OrbitingCircles,
  TechOrbitDisplay,
  AnimatedForm,
  AuthTabs,
  Label,
  BottomGradient,
  Image,
};
