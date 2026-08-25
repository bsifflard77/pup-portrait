import { Fragment, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PAGE_BG = '#FFF4E6';
const INK = '#0F1B35';
const MUTED = '#4B5568';
const GOLD = '#D4A843';
const LINE = '#E5E0D6';

type InlinePart =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'link'; label: string; href: string };

function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push({ type: 'bold', value: token.slice(2, -2) });
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        parts.push({ type: 'link', label: link[1], href: link[2] });
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) });
  }
  return parts.length ? parts : [{ type: 'text', value: text }];
}

function InlineText({
  text,
  style,
  onLink,
}: {
  text: string;
  style: object;
  onLink: (href: string) => void;
}) {
  return (
    <Text style={style}>
      {parseInline(text).map((part, i) => {
        if (part.type === 'bold') {
          return (
            <Text key={i} style={styles.bold}>
              {part.value}
            </Text>
          );
        }
        if (part.type === 'link') {
          return (
            <Text key={i} style={styles.link} onPress={() => onLink(part.href)}>
              {part.label}
            </Text>
          );
        }
        return <Fragment key={i}>{part.value}</Fragment>;
      })}
    </Text>
  );
}

export function LegalDocument({ markdown }: { markdown: string }) {
  const router = useRouter();

  const onLink = (href: string) => {
    if (href.startsWith('/')) {
      router.push(href as any);
      return;
    }
    Linking.openURL(href);
  };

  const blocks = markdown.replace(/\r\n/g, '\n').trim().split(/\n{2,}/);
  const body: ReactNode[] = [];

  blocks.forEach((block, index) => {
    const lines = block.split('\n').map((line) => line.replace(/[ \t]+$/g, ''));
    const first = lines[0] || '';

    if (first.startsWith('# ')) {
      body.push(
        <Text key={index} accessibilityRole="header" style={styles.h1}>
          {first.slice(2)}
        </Text>
      );
      return;
    }
    if (first.startsWith('## ')) {
      body.push(
        <Text key={index} accessibilityRole="header" style={styles.h2}>
          {first.slice(3)}
        </Text>
      );
      return;
    }
    if (lines.every((line) => line.startsWith('- '))) {
      body.push(
        <View key={index} style={styles.list}>
          {lines.map((line, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <InlineText text={line.slice(2)} style={styles.listText} onLink={onLink} />
            </View>
          ))}
        </View>
      );
      return;
    }

    body.push(
      <InlineText
        key={index}
        text={lines.join(' ')}
        style={styles.paragraph}
        onLink={onLink}
      />
    );
  });

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      testID="legal-document"
    >
      <View style={styles.inner}>
        <Pressable onPress={() => router.push('/')} style={styles.brandRow} accessibilityRole="link">
          <View style={styles.brandMark}>
            <Ionicons name="paw" size={16} color={GOLD} />
          </View>
          <Text style={styles.brandName}>Pup Portrait</Text>
        </Pressable>
        {body}
        <View style={styles.footerNav}>
          <Pressable onPress={() => router.push('/privacy' as any)}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => router.push('/terms' as any)}>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => router.push('/')}>
            <Text style={styles.footerLink}>Home</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  content: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 720,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: INK,
    fontSize: 16,
    fontWeight: '700',
  },
  h1: {
    color: INK,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    ...(Platform.OS === 'web' ? { fontFamily: 'Georgia, serif' } : {}),
  },
  h2: {
    color: INK,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
  paragraph: {
    color: MUTED,
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 4,
  },
  bold: {
    color: INK,
    fontWeight: '700',
  },
  link: {
    color: '#1D4ED8',
    textDecorationLine: 'underline',
  },
  list: {
    marginBottom: 4,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    color: GOLD,
    fontSize: 16,
    lineHeight: 26,
    width: 14,
  },
  listText: {
    flex: 1,
    color: MUTED,
    fontSize: 16,
    lineHeight: 26,
  },
  footerNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 36,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: LINE,
    gap: 8,
  },
  footerLink: {
    color: INK,
    fontSize: 14,
    fontWeight: '600',
  },
  footerDot: {
    color: MUTED,
  },
});
