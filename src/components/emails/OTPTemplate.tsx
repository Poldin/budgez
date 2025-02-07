// components/emails/OTPTemplate.tsx
import { 
    Html,
    Head, 
    Preview,
    Container,
    Section,
    Text 
  } from '@react-email/components';
  
  interface OTPTemplateProps {
    otp: string;
    userName?: string;
  }
  
  export const OTPTemplate = ({ otp, userName }: OTPTemplateProps) => (
    <Html>
      <Head />
      <Preview>Il tuo codice di verifica</Preview>
      <Container>
        <Section>
          <Text>Ciao {userName || 'utente'},</Text>
          <Text>Ecco il tuo codice di verifica: {otp}</Text>
          <Text>Il codice scadrà tra 5 minuti.</Text>
        </Section>
      </Container>
    </Html>
  );