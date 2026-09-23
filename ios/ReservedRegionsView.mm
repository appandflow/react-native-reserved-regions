#import "ReservedRegionsView.h"

#import <react/renderer/components/ReservedRegionsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/ReservedRegionsViewSpec/Props.h>
#import <react/renderer/components/ReservedRegionsViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation ReservedRegionsView {
  NSArray<NSDictionary *> *_currentRegions;
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
          [[UIHingeInteraction alloc] initWithUpdateHandler:^(UIHingeInteraction *, UIHingeInteractionUpdate *update) {
            NSLog(@"RRPROBE %p hinge %@", weakSelf, update);
            [weakSelf setNeedsLayout];
          }];
      [self addInteraction:hingeInteraction];
    }
#endif
  }
  return self;
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

  if ([_currentRegions isEqualToArray:regions]) {
    return;
  }
  _currentRegions = [regions copy];

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
  auto eventEmitter = _eventEmitter;
  if (_hasDispatchedRegions) {
    NSLog(@"RRPROBE %p unique bounds=%@ regions=%@", self, NSStringFromCGRect(self.bounds), regions);
    // React Native's EventQueue replaces this view's pending unique event when it is the last one queued.
    eventEmitter->dispatchUniqueEvent(
        "regionsChange",
        folly::dynamic::object("regions", std::move(regionPayloads)));
    return;
  }
  _hasDispatchedRegions = YES;
  NSLog(@"RRPROBE %p sync bounds=%@ regions=%@", self, NSStringFromCGRect(self.bounds), regions);
  eventEmitter->experimental_flushSync([eventEmitter, regions = std::move(regionPayloads)]() mutable {
    eventEmitter->dispatchEvent(
        "regionsChange",
        folly::dynamic::object("regions", std::move(regions)),
        RawEvent::Category::Discrete);
  });
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _currentRegions = nil;
  _hasDispatchedRegions = NO;
}

@end
