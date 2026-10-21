#import "ReservedRegionsView.h"

#import <react/renderer/components/ReservedRegionsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/ReservedRegionsViewSpec/Props.h>
#import <react/renderer/components/ReservedRegionsViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

static NSDictionary *NoBar(double extent)
{
  return @{@"extent": @(extent), @"edge": @"none", @"frame": [NSValue valueWithCGRect:CGRectZero]};
}

@implementation ReservedRegionsView {
  NSArray<NSDictionary *> *_currentRegions;
  NSArray<NSDictionary *> *_currentBars;
  std::vector<double> _barExtents;
  BOOL _hasDispatchedRegions;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ReservedRegionsViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ReservedRegionsViewProps>();
    _props = defaultProps;
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
    if (@available(iOS 27.1, *)) {
      // UIKit posts no reserved-region change notification, so hinge updates schedule the re-query.
      __weak __typeof(self) weakSelf = self;
      UIHingeInteraction *hingeInteraction =
          [[UIHingeInteraction alloc] initWithUpdateHandler:^(UIHingeInteraction *, UIHingeInteractionUpdate *) {
            [weakSelf setNeedsLayout];
          }];
      [self addInteraction:hingeInteraction];
      // The bar layout region depends on UITraitCollection.verticalBarEdge, which UIKit's header says to observe
      // through systemTraitsAffectingVerticalBarEdge.
      [self registerForTraitChanges:UITraitCollection.systemTraitsAffectingVerticalBarEdge
                         withAction:@selector(setNeedsLayout)];
    }
#endif
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = static_cast<const ReservedRegionsViewProps &>(*props);
  if (newProps.barExtents != _barExtents) {
    _barExtents = newProps.barExtents;
    [self setNeedsLayout];
  }
  [super updateProps:props oldProps:oldProps];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateRegions];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self setNeedsLayout];
}

- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  // React Native's UIView+ComponentViewProtocol applies layout through center and bounds; an origin-only change
  // does not trigger layoutSubviews.
  if (layoutMetrics.frame.origin != oldLayoutMetrics.frame.origin) {
    [self setNeedsLayout];
  }
}

- (void)updateEventEmitter:(EventEmitter::Shared const &)eventEmitter
{
  [super updateEventEmitter:eventEmitter];
  [self setNeedsLayout];
}

- (void)updateRegions
{
  if (self.window == nil || !_eventEmitter || CGSizeEqualToSize(self.bounds.size, CGSizeZero)) {
    return;
  }

  NSMutableArray<NSDictionary *> *regions = [NSMutableArray new];
  NSMutableArray<NSDictionary *> *bars = [NSMutableArray new];
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
  if (@available(iOS 27.1, *)) {
    NSArray<UIViewReservedRegionKind *> *kinds = @[
      UIViewReservedRegionKind.divisionRegionKind,
      UIViewReservedRegionKind.occlusionRegionKind,
    ];
    NSArray<NSString *> *names = @[@"division", @"occlusion"];
    for (NSUInteger index = 0; index < kinds.count; index++) {
      for (UIViewReservedRegion *region in [self reservedRegionsOfKind:kinds[index]
                                                              options:UIViewReservedRegionQueryOptionsNone]) {
        [regions addObject:@{@"kind": names[index], @"frame": [NSValue valueWithCGRect:region.frame]}];
      }
    }
  }
#endif
  for (double extent : _barExtents) {
    NSDictionary *bar = NoBar(extent);
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
    if (@available(iOS 27.1, *)) {
      bar = [self barForExtent:extent];
    }
#endif
    [bars addObject:bar];
  }

  if ([_currentRegions isEqualToArray:regions] && [_currentBars isEqualToArray:bars]) {
    return;
  }
  _currentRegions = [regions copy];
  _currentBars = [bars copy];

  auto regionPayloads = folly::dynamic::array();
  for (NSDictionary *region in regions) {
    CGRect frame = [region[@"frame"] CGRectValue];
    regionPayloads.push_back(folly::dynamic::object
        ("kind", [region[@"kind"] UTF8String])
        ("frame", folly::dynamic::object
            ("x", frame.origin.x)
            ("y", frame.origin.y)
            ("width", frame.size.width)
            ("height", frame.size.height))
        ("occludesContent", false));
  }
  auto barPayloads = folly::dynamic::array();
  for (NSDictionary *bar in bars) {
    CGRect frame = [bar[@"frame"] CGRectValue];
    barPayloads.push_back(folly::dynamic::object
        ("extent", [bar[@"extent"] doubleValue])
        ("edge", [bar[@"edge"] UTF8String])
        ("frame", folly::dynamic::object
            ("x", frame.origin.x)
            ("y", frame.origin.y)
            ("width", frame.size.width)
            ("height", frame.size.height)));
  }
  auto payload = folly::dynamic::object("regions", std::move(regionPayloads))("bars", std::move(barPayloads));
  auto eventEmitter = _eventEmitter;
  if (_hasDispatchedRegions) {
    // React Native's EventQueue replaces this view's pending unique event when it is the last one queued.
    eventEmitter->dispatchUniqueEvent("regionsChange", std::move(payload));
    return;
  }
  _hasDispatchedRegions = YES;
  eventEmitter->experimental_flushSync([eventEmitter, payload = std::move(payload)]() mutable {
    eventEmitter->dispatchEvent("regionsChange", std::move(payload), RawEvent::Category::Discrete);
  });
}

#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
- (NSDictionary *)barForExtent:(double)extent API_AVAILABLE(ios(27.1))
{
  UIWindow *window = self.window;
  UIVerticalBarEdge edge = self.traitCollection.verticalBarEdge;
  if (edge == UIVerticalBarEdgeUnspecified) {
    return NoBar(extent);
  }
  UIViewLayoutRegion *layoutRegion = [UIViewLayoutRegion
      layoutRegionForBarOnDirectionalEdge:edge == UIVerticalBarEdgeLeading ? NSDirectionalRectEdgeLeading
                                                                           : NSDirectionalRectEdgeTrailing
                                   extent:extent];
  // UIKit computes a view's bar layout region from that view's own bounds and safe area, so a provider that is
  // shifted or inset away from the column gets a region at its own trailing edge. Only the window's region matches
  // the system bar.
  CGRect windowBar = UIEdgeInsetsInsetRect(window.bounds, [window edgeInsetsForLayoutRegion:layoutRegion]);
  CGRect frame = [window convertRect:windowBar toView:self];
  if (CGRectIsEmpty(windowBar) || !CGRectIntersectsRect(frame, self.bounds)) {
    return NoBar(extent);
  }
  return @{
    @"extent": @(extent),
    @"edge": edge == UIVerticalBarEdgeLeading ? @"leading" : @"trailing",
    @"frame": [NSValue valueWithCGRect:frame],
  };
}
#endif

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _currentRegions = nil;
  _currentBars = nil;
  _hasDispatchedRegions = NO;
}

@end
