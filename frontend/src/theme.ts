import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  colors: {
    brand: {
      50: '#e6f3ff',
      100: '#b3daff',
      200: '#80c1ff',
      300: '#4da8ff',
      400: '#1a8fff',
      500: '#00AEEF',
      600: '#0099d6',
      700: '#0084bd',
      800: '#006fa4',
      900: '#0D2B8E',
    },
    surface: '#0E1117',
    card: '#15191E',
    success: '#00E778',
    missed: '#FF6B00',
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'surface' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      variants: {
        primary: {
          background: 'linear-gradient(135deg, #0D2B8E 0%, #00AEEF 100%)',
          color: 'white',
          _hover: {
            background: 'linear-gradient(135deg, #0a2478 0%, #0099d6 100%)',
            transform: 'translateY(-1px)',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
        secondary: {
          bg: 'gray.700',
          color: 'white',
          _hover: {
            bg: 'gray.600',
          },
        },
      },
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'card' : 'white',
          borderRadius: 'xl',
          boxShadow: 'lg',
        },
      }),
    },
  },
})

export { theme }