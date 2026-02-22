import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

type PortalMap = Map<string, React.ReactNode>;

interface PortalContextType {
  mount: (key: string, children: React.ReactNode) => void;
  unmount: (key: string) => void;
}

const PortalContext = createContext<PortalContextType | null>(null);

let nextPortalId = 0;

/**
 * Wrap your app root with PortalProvider.
 * All <Portal> children will render at this level, above everything else.
 */
export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [portals, setPortals] = useState<PortalMap>(new Map());

  const mount = useCallback((key: string, node: React.ReactNode) => {
    setPortals(prev => new Map(prev).set(key, node));
  }, []);

  const unmount = useCallback((key: string) => {
    setPortals(prev => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  return (
    <PortalContext.Provider value={{ mount, unmount }}>
      <View style={styles.container} collapsable={false}>
        {children}
        {Array.from(portals.entries()).map(([key, node]) => (
          <View key={key} style={styles.portalHost} pointerEvents="box-none">
            {node}
          </View>
        ))}
      </View>
    </PortalContext.Provider>
  );
}

/**
 * Renders its children at the PortalProvider level (above all other content).
 * Use this instead of react-native Modal.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('Portal must be used within a PortalProvider');
  }

  const keyRef = useRef(`portal-${++nextPortalId}`);
  const { mount, unmount } = ctx;

  useEffect(() => {
    mount(keyRef.current, children);
  }, [children, mount]);

  useEffect(() => {
    return () => unmount(keyRef.current);
  }, [unmount]);

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  portalHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
