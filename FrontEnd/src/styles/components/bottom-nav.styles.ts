import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    width: '100%',
    borderWidth: 1,
    borderColor: '#222222',
    borderBottomWidth: 0,
    borderRadius: 0,
    backgroundColor: '#080808',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  navLight: {
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  item: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  itemPressable: {
    flex: 1,
  },
  itemActive: {
    backgroundColor: 'transparent',
  },
  label: {
    color: '#6e7683',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  labelLight: {
    color: '#8a94a5',
  },
  labelActive: {
    color: '#ffffff',
  },
  labelActiveLight: {
    color: '#050505',
  },
});
